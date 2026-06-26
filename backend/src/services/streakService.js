const prisma = require('../config/prisma')

const milestones = [7, 15, 30, 60, 100]

function pad(value) {
  return String(value).padStart(2, '0')
}

function datePartsInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts(date)

  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
}

function dateKeyInTimezone(date, timezone) {
  const parts = datePartsInTimezone(date, timezone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

function keyToUtcDate(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(key, amount) {
  const date = keyToUtcDate(key)
  date.setUTCDate(date.getUTCDate() + amount)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function compareKeys(a, b) {
  return a.localeCompare(b)
}

function daysBetween(startKey, endKey) {
  const start = keyToUtcDate(startKey)
  const end = keyToUtcDate(endKey)
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1)
}

function startOfWeekKey(todayKey) {
  const date = keyToUtcDate(todayKey)
  const day = date.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  date.setUTCDate(date.getUTCDate() - diff)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function monthDays(month, year) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

async function getStreakContext(userId) {
  const [user, completedSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        timezone: true,
      },
    }),
    prisma.missionSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      select: {
        completedAt: true,
        endedAt: true,
      },
      orderBy: { endedAt: 'asc' },
    }),
  ])
  const timezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const todayKey = dateKeyInTimezone(new Date(), timezone)
  const completedDayKeys = [...new Set(completedSessions
    .map((session) => session.completedAt || session.endedAt)
    .filter(Boolean)
    .map((date) => dateKeyInTimezone(date, timezone)))]
    .sort(compareKeys)
  const firstCompletedKey = completedDayKeys[0]
  const userCreatedKey = user?.createdAt ? dateKeyInTimezone(user.createdAt, timezone) : todayKey
  const trackingStartKey = firstCompletedKey || userCreatedKey

  return {
    completedDayKeys,
    completedDaySet: new Set(completedDayKeys),
    firstCompletedKey,
    timezone,
    todayKey,
    trackingStartKey,
    userCreatedKey,
  }
}

function calculateCurrentStreak(context) {
  let cursor = context.completedDaySet.has(context.todayKey)
    ? context.todayKey
    : addDays(context.todayKey, -1)
  let currentStreak = 0

  while (context.completedDaySet.has(cursor)) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  return currentStreak
}

function calculateBestStreak(completedDayKeys) {
  let bestStreak = 0
  let current = 0
  let previousKey = null

  completedDayKeys.forEach((key) => {
    current = previousKey && addDays(previousKey, 1) === key ? current + 1 : 1
    bestStreak = Math.max(bestStreak, current)
    previousKey = key
  })

  return bestStreak
}

function milestoneSummary(currentStreak) {
  const nextMilestone = milestones.find((milestone) => milestone > currentStreak) || milestones[milestones.length - 1]
  return {
    milestoneProgress: Math.min(100, Math.round((currentStreak / nextMilestone) * 100)),
    nextMilestone,
  }
}

function dayState(key, context) {
  if (compareKeys(key, context.todayKey) > 0) {
    return 'FUTURE'
  }

  if (context.completedDaySet.has(key)) {
    return 'COMPLETED'
  }

  if (key === context.todayKey) {
    return 'TODAY'
  }

  if (compareKeys(key, context.trackingStartKey) < 0) {
    return 'NO_DATA'
  }

  return 'MISSED'
}

async function getStreakSummary(userId) {
  const context = await getStreakContext(userId)
  const currentStreak = calculateCurrentStreak(context)
  const bestStreak = calculateBestStreak(context.completedDayKeys)
  const trackedDays = daysBetween(context.trackingStartKey, context.todayKey)
  const trackedCompletedDays = context.completedDayKeys.filter((key) =>
    compareKeys(key, context.trackingStartKey) >= 0 && compareKeys(key, context.todayKey) <= 0).length
  const week = await getWeeklyConsistency(userId, context)
  const milestone = milestoneSummary(currentStreak)

  return {
    bestStreak,
    completionRate: trackedDays ? Math.round((trackedCompletedDays / trackedDays) * 100) : 0,
    currentStreak,
    milestoneProgress: milestone.milestoneProgress,
    nextMilestone: milestone.nextMilestone,
    thisWeekCompletedDays: week.completedDays,
    thisWeekTotalDays: week.totalDays,
    totalCompletedDays: trackedCompletedDays,
    totalTrackedDays: trackedDays,
    trackingStartDate: context.trackingStartKey,
  }
}

async function getCalendarMonth(userId, month, year) {
  const context = await getStreakContext(userId)
  const totalDays = monthDays(month, year)
  const days = Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1
    const date = `${year}-${pad(month)}-${pad(dayNumber)}`

    return {
      date,
      dayNumber,
      state: dayState(date, context),
    }
  })

  return {
    days,
    month,
    year,
  }
}

async function getWeeklyConsistency(userId, providedContext) {
  const context = providedContext || await getStreakContext(userId)
  const weekStart = startOfWeekKey(context.todayKey)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    return {
      date,
      dayNumber: Number(date.slice(-2)),
      state: dayState(date, context),
    }
  })
  const completedDays = days.filter((day) => day.state === 'COMPLETED').length

  return {
    completedDays,
    days,
    percentage: Math.round((completedDays / 7) * 100),
    totalDays: 7,
  }
}

async function getMilestones(userId) {
  const context = await getStreakContext(userId)
  const currentStreak = calculateCurrentStreak(context)

  return milestones.map((milestone) => ({
    currentStreak,
    milestone,
    progress: Math.min(100, Math.round((currentStreak / milestone) * 100)),
    title: `${milestone}-Day Streak`,
    unlocked: currentStreak >= milestone,
  }))
}

module.exports = {
  getCalendarMonth,
  getMilestones,
  getStreakSummary,
  getWeeklyConsistency,
}
