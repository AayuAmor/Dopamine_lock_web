const prisma = require('../config/prisma')
const { getAchievementSummary } = require('./achievementService')
const { getConsumptionSummary, getIdentityConsumptionStats } = require('./consumptionService')
const { getDisciplineScore } = require('./disciplineScoreService')
const { getGoalSummary } = require('./goalService')
const { getSummary: getSessionSummary } = require('./sessionHistoryService')
const { getStreakSummary } = require('./streakService')

const titleStatements = {
  'Discipline Beginner': 'Every disciplined person starts with one completed mission.',
  'Focus Builder': 'You are developing consistent focus habits.',
  'Disciplined Builder': 'You are becoming the type of person who finishes what they start.',
  'Deep Work Beast': 'Deep work has become a repeatable habit.',
  'Discipline Master': 'Discipline is no longer an action. It is part of your identity.',
  'Digital Minimalist': 'You consume intentionally and create consistently.',
  'Consistent Creator': 'You protect your attention and turn consistency into creative output.',
  'Elite Executor': 'You consistently execute meaningful work while resisting distraction.',
}

const rankValues = { D: 0, C: 1, B: 2, A: 3, S: 4, 'S+': 5 }

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function tierForScore(score) {
  if (score >= 90) return 'LEGENDARY'
  if (score >= 75) return 'ELITE'
  if (score >= 60) return 'STRONG'
  if (score >= 40) return 'GROWING'
  if (score >= 20) return 'FOUNDATION'
  return 'STARTER'
}

function traitStatus(score) {
  if (score >= 85) return 'Elite'
  if (score >= 65) return 'Strong'
  if (score >= 35) return 'Growing'
  return 'Weak'
}

function titleForStats(score, stats, traits) {
  const rankValue = rankValues[stats.disciplineRank] || 0
  const digital = traits.find((trait) => trait.name === 'Digital Discipline')?.score || 0

  if (score >= 90 && stats.completedMissions >= 100 && rankValue >= rankValues.S) return 'Elite Executor'
  if (digital >= 90 && stats.healthyConsumptionScore >= 90 && stats.completedMissions >= 20) return 'Digital Minimalist'
  if (stats.currentStreak >= 30 && stats.completedMissions >= 30 && stats.goalsCompleted >= 3) return 'Consistent Creator'
  if (rankValue >= rankValues.S || score >= 80) return 'Discipline Master'
  if (stats.totalFocusHours >= 50 && stats.averageSessionMinutes >= 60) return 'Deep Work Beast'
  if (stats.completedMissions >= 10 || score >= 45) return 'Disciplined Builder'
  if (stats.completedMissions >= 1 || stats.totalFocusHours >= 2 || score >= 20) return 'Focus Builder'
  return 'Discipline Beginner'
}

function buildTrait(name, score, explanation) {
  return {
    explanation,
    name,
    score: clamp(score),
    status: traitStatus(score),
  }
}

function calculateTraits(stats) {
  const focusConsistency = (stats.currentStreak / 30) * 50 + (stats.successRate / 100) * 50
  const executionReliability = stats.successRate
  const deepWorkStrength = (stats.averageSessionMinutes / 120) * 60 + (stats.totalFocusHours / 100) * 40
  const goalCommitment = (stats.goalsCompleted / 10) * 65 + (stats.averageGoalProgress / 100) * 35
  const digitalDiscipline = stats.healthyConsumptionScore
  const distractionResistance = (stats.blockedWebsitesResisted / 100) * 50 + (stats.successRate / 100) * 50

  return [
    buildTrait('Focus Consistency', focusConsistency, 'Built from current streak and mission completion reliability.'),
    buildTrait('Execution Reliability', executionReliability, 'Measures how often you complete missions instead of abandoning them.'),
    buildTrait('Deep Work Strength', deepWorkStrength, 'Combines average session length with total focus hours.'),
    buildTrait('Goal Commitment', goalCommitment, 'Reflects completed goals and average goal progress.'),
    buildTrait('Digital Discipline', digitalDiscipline, 'Based on healthy consumption and daily control score.'),
    buildTrait('Distraction Resistance', distractionResistance, 'Uses blocked distractions resisted and mission reliability.'),
  ]
}

function strongestAndWeakest(traits) {
  const ordered = [...traits].sort((a, b) => b.score - a.score)
  return {
    strongest: ordered[0] || null,
    weakest: ordered[ordered.length - 1] || null,
  }
}

function calculateIdentityScore(stats) {
  const missionCompletion = stats.successRate
  const focusHours = clamp((stats.totalFocusHours / 100) * 100)
  const currentStreak = clamp((stats.currentStreak / 30) * 100)
  const disciplineScore = clamp((stats.disciplineXp / 1500) * 100)
  const consumptionControl = stats.healthyConsumptionScore
  const goalsCompleted = clamp((stats.goalsCompleted / 10) * 100)
  const achievements = stats.achievementCompletionPercentage

  return clamp(
    missionCompletion * 0.25 +
    focusHours * 0.20 +
    currentStreak * 0.20 +
    disciplineScore * 0.15 +
    consumptionControl * 0.10 +
    goalsCompleted * 0.05 +
    achievements * 0.05,
  )
}

async function gatherIdentityStats(userId) {
  const [user, sessions, streak, discipline, consumption, consumptionIdentity, goals, achievements, blockResistance] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getSessionSummary(userId),
    getStreakSummary(userId),
    getDisciplineScore(userId),
    getConsumptionSummary(userId),
    getIdentityConsumptionStats(userId),
    getGoalSummary(userId),
    getAchievementSummary(userId),
    prisma.missionSession.aggregate({
      _sum: { blockedWebsitesCount: true },
      where: { userId, status: 'COMPLETED' },
    }),
  ])

  const totalFocusHours = Number(sessions.totalFocusHours || 0)
  const averageSessionMinutes = Math.round((sessions.averageSessionDuration || 0) / 60)

  return {
    achievementCompletionPercentage: achievements.completionPercentage || 0,
    achievementsUnlocked: achievements.unlocked || 0,
    averageGoalProgress: goals.averageProgress || 0,
    averageSessionMinutes,
    bestStreak: streak.bestStreak || 0,
    blockedWebsitesResisted: blockResistance._sum.blockedWebsitesCount || 0,
    completedMissions: sessions.completedSessions || 0,
    consumptionRating: consumptionIdentity.rating || 'D',
    currentStreak: streak.currentStreak || 0,
    disciplineRank: discipline.currentRank || 'D',
    disciplineXp: discipline.totalXp || 0,
    goalsCompleted: goals.completedGoals || 0,
    healthyConsumptionScore: consumption.dailyConsumptionScore ?? 100,
    memberSince: user?.createdAt || null,
    successRate: sessions.successRate || 0,
    totalFocusHours,
    totalSessions: sessions.totalSessions || 0,
    user,
  }
}

function formatIdentity(record, stats, traits) {
  const { strongest, weakest } = strongestAndWeakest(traits)
  return {
    achievementCompletionPercentage: stats.achievementCompletionPercentage,
    achievementsUnlocked: stats.achievementsUnlocked,
    bestStreak: stats.bestStreak,
    completedMissions: stats.completedMissions,
    consumptionScore: stats.healthyConsumptionScore,
    currentStreak: stats.currentStreak,
    currentTier: record.currentTier,
    currentTitle: record.currentTitle,
    digitalDisciplineRating: stats.consumptionRating,
    disciplineRank: stats.disciplineRank,
    goalsCompleted: stats.goalsCompleted,
    identityScore: record.identityScore,
    identityStatement: record.identityStatement,
    memberSince: stats.memberSince,
    strongestTrait: strongest,
    totalFocusHours: stats.totalFocusHours,
    weakestTrait: weakest,
  }
}

async function calculateIdentity(userId, { persist = true } = {}) {
  const stats = await gatherIdentityStats(userId)
  const traits = calculateTraits(stats)
  const score = calculateIdentityScore(stats)
  const title = titleForStats(score, stats, traits)
  const now = new Date()
  const { strongest, weakest } = strongestAndWeakest(traits)
  const identityData = {
    calculatedAt: now,
    currentTier: tierForScore(score),
    currentTitle: title,
    identityScore: score,
    identityStatement: titleStatements[title],
    strongestTrait: strongest?.name || null,
    weakestTrait: weakest?.name || null,
  }

  if (!persist) {
    return formatIdentity(identityData, stats, traits)
  }

  const record = await prisma.userIdentity.upsert({
    create: { ...identityData, userId },
    update: identityData,
    where: { userId },
  })

  await prisma.identitySnapshot.upsert({
    create: {
      score,
      snapshotDate: startOfUtcDay(now),
      tier: record.currentTier,
      title: record.currentTitle,
      userId,
    },
    update: {
      score,
      tier: record.currentTier,
      title: record.currentTitle,
    },
    where: {
      userId_snapshotDate: {
        snapshotDate: startOfUtcDay(now),
        userId,
      },
    },
  })

  return formatIdentity(record, stats, traits)
}

async function getIdentity(userId) {
  return calculateIdentity(userId)
}

async function getTraits(userId) {
  const stats = await gatherIdentityStats(userId)
  return calculateTraits(stats)
}

async function getProgression(userId) {
  const snapshots = await prisma.identitySnapshot.findMany({
    orderBy: { snapshotDate: 'asc' },
    where: { userId },
  })

  if (snapshots.length === 0) {
    await calculateIdentity(userId)
    return prisma.identitySnapshot.findMany({
      orderBy: { snapshotDate: 'asc' },
      where: { userId },
    })
  }

  return snapshots
}

async function getSummary(userId) {
  const identity = await calculateIdentity(userId)
  return {
    currentTier: identity.currentTier,
    currentTitle: identity.currentTitle,
    identityScore: identity.identityScore,
    strongestTrait: identity.strongestTrait,
    statement: identity.identityStatement,
  }
}

async function recalculateIdentity(userId) {
  return calculateIdentity(userId)
}

function scheduleIdentityRecalculation(userId, reason = 'activity') {
  if (!userId) return
  setTimeout(() => {
    recalculateIdentity(userId).catch((error) => {
      console.error(`Identity recalculation failed after ${reason}:`, error)
    })
  }, 0)
}

module.exports = {
  calculateIdentity,
  getIdentity,
  getProgression,
  getSummary,
  getTraits,
  recalculateIdentity,
  scheduleIdentityRecalculation,
}
