const prisma = require('../config/prisma')
const { getConsumptionSummary } = require('./consumptionService')
const { getStreakSummary } = require('./streakService')

const rankBands = [
  { rank: 'D', min: 0, max: 199 },
  { rank: 'C', min: 200, max: 399 },
  { rank: 'B', min: 400, max: 699 },
  { rank: 'A', min: 700, max: 999 },
  { rank: 'S', min: 1000, max: 1499 },
  { rank: 'S+', min: 1500, max: null },
]

const sourceLabels = {
  BLOCK_RESISTANCE: 'Distraction Resistance',
  FOCUS_DURATION: 'Focus Duration',
  HEALTHY_CONSUMPTION: 'Healthy Consumption',
  MANUAL_RECALCULATION: 'Manual Recalculation',
  MISSION_ABANDONED: 'Failed Missions',
  MISSION_COMPLETION: 'Mission Completion',
  STREAK_BONUS: 'Streak Strength',
}

function rankForXp(totalXp) {
  const currentXp = Math.max(0, totalXp)
  const index = rankBands.findIndex((band) => currentXp >= band.min && (band.max === null || currentXp <= band.max))
  const currentBand = rankBands[index] || rankBands[0]
  const nextBand = rankBands[index + 1] || null
  const xpForCurrentRank = currentBand.min
  const xpForNextRank = nextBand ? nextBand.min : currentBand.min
  const xpNeeded = nextBand ? Math.max(0, nextBand.min - currentXp) : 0
  const rankSpan = nextBand ? nextBand.min - currentBand.min : 1
  const progressPercentage = nextBand
    ? Math.min(100, Math.round(((currentXp - currentBand.min) / rankSpan) * 100))
    : 100

  return {
    currentRank: currentBand.rank,
    currentXp,
    nextRank: nextBand?.rank || null,
    progressPercentage,
    xpForCurrentRank,
    xpForNextRank,
    xpNeeded,
  }
}

function topPercentText(totalXp) {
  if (totalXp >= 1500) return 'Top 1%'
  if (totalXp >= 1000) return 'Top 5%'
  if (totalXp >= 700) return 'Top 12%'
  if (totalXp >= 400) return 'Top 25%'
  if (totalXp >= 200) return 'Top 45%'
  return 'Building baseline'
}

function safeDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function eventMetadata(session) {
  return {
    durationMinutes: session.actualDurationMinutes || Math.max(0, Math.round((session.elapsedSeconds || 0) / 60)),
    missionId: session.missionId,
    missionSessionId: session.id,
    missionTitle: session.mission?.title || 'Mission',
  }
}

function focusDurationPoints(session) {
  const durationMinutes = session.actualDurationMinutes || Math.max(0, Math.floor((session.elapsedSeconds || 0) / 60))
  return Math.floor(durationMinutes / 25) * 10
}

async function syncScoreFromEvents(userId, tx = prisma) {
  const events = await tx.disciplineScoreEvent.findMany({
    where: { userId },
    select: { points: true },
  })
  const totalXp = Math.max(0, events.reduce((sum, event) => sum + event.points, 0))
  const rank = rankForXp(totalXp)
  const now = new Date()

  const score = await tx.disciplineScore.upsert({
    create: {
      currentRank: rank.currentRank,
      lastCalculatedAt: now,
      nextRank: rank.nextRank,
      progressToNextRank: rank.progressPercentage,
      totalXp,
      userId,
    },
    update: {
      currentRank: rank.currentRank,
      lastCalculatedAt: now,
      nextRank: rank.nextRank,
      progressToNextRank: rank.progressPercentage,
      totalXp,
    },
    where: { userId },
  })

  await tx.disciplineScoreSnapshot.upsert({
    create: {
      date: new Date(`${safeDateKey(now)}T00:00:00.000Z`),
      rank: rank.currentRank,
      score: totalXp,
      userId,
    },
    update: {
      rank: rank.currentRank,
      score: totalXp,
    },
    where: {
      userId_date: {
        date: new Date(`${safeDateKey(now)}T00:00:00.000Z`),
        userId,
      },
    },
  })

  return { score, rank }
}

async function createSessionScoreEvents(tx, session) {
  const metadata = eventMetadata(session)

  if (session.status === 'COMPLETED') {
    await tx.disciplineScoreEvent.upsert({
      create: {
        description: `Completed ${metadata.missionTitle}`,
        metadata,
        missionSessionId: session.id,
        points: 25,
        source: 'MISSION_COMPLETION',
        userId: session.userId,
      },
      update: {},
      where: {
        source_missionSessionId: {
          missionSessionId: session.id,
          source: 'MISSION_COMPLETION',
        },
      },
    })

    const focusPoints = focusDurationPoints(session)
    if (focusPoints > 0) {
      await tx.disciplineScoreEvent.upsert({
        create: {
          description: `Focused for ${metadata.durationMinutes} minutes`,
          metadata,
          missionSessionId: session.id,
          points: focusPoints,
          source: 'FOCUS_DURATION',
          userId: session.userId,
        },
        update: {},
        where: {
          source_missionSessionId: {
            missionSessionId: session.id,
            source: 'FOCUS_DURATION',
          },
        },
      })
    }

    const resistancePoints = session.blockedWebsitesCount || 0
    if (resistancePoints > 0) {
      await tx.disciplineScoreEvent.upsert({
        create: {
          description: `Protected against ${resistancePoints} blocked websites`,
          metadata: { ...metadata, blockedWebsitesCount: resistancePoints },
          missionSessionId: session.id,
          points: resistancePoints,
          source: 'BLOCK_RESISTANCE',
          userId: session.userId,
        },
        update: {},
        where: {
          source_missionSessionId: {
            missionSessionId: session.id,
            source: 'BLOCK_RESISTANCE',
          },
        },
      })
    }
  }

  if (session.status === 'ABANDONED') {
    await tx.disciplineScoreEvent.upsert({
      create: {
        description: `Abandoned ${metadata.missionTitle}`,
        metadata,
        missionSessionId: session.id,
        points: -10,
        source: 'MISSION_ABANDONED',
        userId: session.userId,
      },
      update: {},
      where: {
        source_missionSessionId: {
          missionSessionId: session.id,
          source: 'MISSION_ABANDONED',
        },
      },
    })
  }
}

async function rebuildScoreForUser(userId) {
  const [sessions, streak, consumption] = await Promise.all([
    prisma.missionSession.findMany({
      include: { mission: true },
      orderBy: { endedAt: 'asc' },
      where: {
        status: { in: ['COMPLETED', 'ABANDONED'] },
        userId,
      },
    }),
    getStreakSummary(userId),
    getConsumptionSummary(userId),
  ])

  return prisma.$transaction(async (tx) => {
    await tx.disciplineScoreEvent.deleteMany({ where: { userId } })

    for (const session of sessions) {
      await createSessionScoreEvents(tx, session)
    }

    const streakPoints = ((streak.currentStreak || 0) * 5) + ((streak.bestStreak || 0) * 2)
    if (streakPoints > 0) {
      await tx.disciplineScoreEvent.create({
        data: {
          description: 'Current and best streak discipline bonus',
          metadata: {
            bestStreak: streak.bestStreak || 0,
            currentStreak: streak.currentStreak || 0,
          },
          points: streakPoints,
          source: 'STREAK_BONUS',
          userId,
        },
      })
    }

    if (sessions.length > 0 && consumption.dailyConsumptionScore >= 80) {
      await tx.disciplineScoreEvent.create({
        data: {
          description: 'Healthy consumption maintained',
          metadata: {
            consumptionScore: consumption.dailyConsumptionScore,
            statusText: consumption.statusText,
          },
          points: 75,
          source: 'HEALTHY_CONSUMPTION',
          userId,
        },
      })
    }

    const result = await syncScoreFromEvents(userId, tx)
    return formatScore(result.score)
  })
}

async function recordMissionSessionScore(session) {
  await prisma.$transaction(async (tx) => {
    await createSessionScoreEvents(tx, session)
  })

  return rebuildScoreForUser(session.userId)
}

function formatScore(scoreRecord) {
  const totalXp = scoreRecord?.totalXp || 0
  const rank = rankForXp(totalXp)

  return {
    ...rank,
    lastCalculatedAt: scoreRecord?.lastCalculatedAt || null,
    progressToNextRank: rank.progressPercentage,
    topPercentText: topPercentText(totalXp),
    totalXp,
  }
}

async function ensureScore(userId) {
  const score = await prisma.disciplineScore.findUnique({ where: { userId } })

  if (score) {
    return score
  }

  return rebuildScoreForUser(userId)
}

async function getDisciplineScore(userId) {
  const score = await ensureScore(userId)
  return formatScore(score)
}

async function getScoreBreakdown(userId) {
  await ensureScore(userId)
  const groups = await prisma.disciplineScoreEvent.groupBy({
    _sum: { points: true },
    by: ['source'],
    where: { userId },
  })
  const totalPositive = groups
    .filter((group) => (group._sum.points || 0) > 0)
    .reduce((sum, group) => sum + (group._sum.points || 0), 0)
  const orderedSources = [
    'MISSION_COMPLETION',
    'FOCUS_DURATION',
    'STREAK_BONUS',
    'BLOCK_RESISTANCE',
    'HEALTHY_CONSUMPTION',
    'MISSION_ABANDONED',
  ]

  return orderedSources.map((source) => {
    const points = groups.find((group) => group.source === source)?._sum.points || 0
    return {
      label: sourceLabels[source],
      percentage: points > 0 && totalPositive > 0 ? Math.round((points / totalPositive) * 100) : 0,
      points,
      source,
    }
  })
}

async function getScoreEvents(userId) {
  await ensureScore(userId)
  const events = await prisma.disciplineScoreEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    where: { userId },
  })

  return events.map((event) => ({
    createdAt: event.createdAt,
    description: event.description,
    id: event.id,
    metadata: event.metadata,
    points: event.points,
    source: event.source,
    sourceLabel: sourceLabels[event.source] || event.source,
  }))
}

async function getScoreTrend(userId) {
  await ensureScore(userId)
  const today = new Date(`${safeDateKey()}T00:00:00.000Z`)
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - 6)
  const snapshots = await prisma.disciplineScoreSnapshot.findMany({
    orderBy: { date: 'asc' },
    where: {
      date: { gte: start, lte: today },
      userId,
    },
  })
  const byDate = new Map(snapshots.map((snapshot) => [safeDateKey(snapshot.date), snapshot]))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    const key = safeDateKey(date)
    const snapshot = byDate.get(key)

    return {
      date: key,
      rank: snapshot?.rank || 'D',
      score: snapshot?.score || 0,
    }
  })
}

module.exports = {
  getDisciplineScore,
  getScoreBreakdown,
  getScoreEvents,
  getScoreTrend,
  rankForXp,
  rebuildScoreForUser,
  recordMissionSessionScore,
}
