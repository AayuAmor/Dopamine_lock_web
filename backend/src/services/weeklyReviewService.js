const prisma = require('../config/prisma')
const { getAchievementSummary } = require('./achievementService')
const { getConsumptionAnalytics } = require('./analyticsService')
const { getDisciplineScore } = require('./disciplineScoreService')
const { getGoalSummary } = require('./goalService')
const { getSummary: getIdentitySummary } = require('./identityService')
const { getStreakSummary } = require('./streakService')

const MS_PER_DAY = 86400000

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

function dateKey(date) {
  return date.toISOString().slice(0, 10)
}

function displayRange(start, end) {
  const formatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' })
  return `${formatter.format(start)} – ${formatter.format(addDays(end, -1))}`
}

function parseWeekRange(query = {}) {
  const today = startOfUtcDay()
  if (!query.startDate && !query.endDate) {
    const end = addDays(today, 1)
    return { end, start: addDays(end, -7) }
  }

  const start = new Date(`${query.startDate}T00:00:00.000Z`)
  const endInclusive = new Date(`${query.endDate}T00:00:00.000Z`)
  return { start, end: addDays(endInclusive, 1) }
}

function gradeForScore(score) {
  if (score >= 95) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function sessionMinutes(session) {
  return session.actualDurationMinutes || Math.round((session.elapsedSeconds || 0) / 60)
}

function dayLabel(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
}

function groupByDay(sessions) {
  const days = new Map()
  sessions.forEach((session) => {
    const key = dateKey(startOfUtcDay(session.endedAt || session.completedAt || session.startedAt))
    const current = days.get(key) || { abandoned: 0, completed: 0, focusMinutes: 0, sessions: 0 }
    current.sessions += 1
    if (session.status === 'COMPLETED') current.completed += 1
    if (session.status === 'ABANDONED') current.abandoned += 1
    current.focusMinutes += session.status === 'COMPLETED' ? sessionMinutes(session) : 0
    days.set(key, current)
  })
  return days
}

function bestWorstFocusDays(days) {
  if (days.size === 0) return { best: 'None', bestMinutes: 0, worst: 'None', worstMinutes: 0 }
  const entries = [...days.entries()].sort((a, b) => b[1].focusMinutes - a[1].focusMinutes)
  const best = entries[0]
  const worst = entries[entries.length - 1]
  return {
    best: dayLabel(new Date(`${best[0]}T00:00:00.000Z`)),
    bestMinutes: best[1].focusMinutes,
    worst: dayLabel(new Date(`${worst[0]}T00:00:00.000Z`)),
    worstMinutes: worst[1].focusMinutes,
  }
}

async function getWeeklySessions(userId, start, end) {
  return prisma.missionSession.findMany({
    include: { mission: true },
    orderBy: { endedAt: 'asc' },
    where: {
      endedAt: { gte: start, lt: end },
      status: { in: ['COMPLETED', 'ABANDONED'] },
      userId,
    },
  })
}

async function getWeeklyStats(userId, start, end) {
  const [sessions, streak, discipline, goals, achievements, identity, consumption, scoreEvents, achievementsUnlocked] = await Promise.all([
    getWeeklySessions(userId, start, end),
    getStreakSummary(userId),
    getDisciplineScore(userId),
    getGoalSummary(userId),
    getAchievementSummary(userId),
    getIdentitySummary(userId),
    getConsumptionAnalytics(userId, { startDate: dateKey(start), endDate: dateKey(addDays(end, -1)) }),
    prisma.disciplineScoreEvent.aggregate({
      _sum: { points: true },
      where: { createdAt: { gte: start, lt: end }, userId },
    }),
    prisma.userAchievement.findMany({
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
      where: { completed: true, unlockedAt: { gte: start, lt: end }, userId },
    }),
  ])

  const completed = sessions.filter((session) => session.status === 'COMPLETED')
  const abandoned = sessions.filter((session) => session.status === 'ABANDONED')
  const focusMinutes = completed.reduce((sum, session) => sum + sessionMinutes(session), 0)
  const durations = completed.map(sessionMinutes).filter((value) => value > 0)
  const days = groupByDay(sessions)
  const focusDays = bestWorstFocusDays(days)
  const longest = durations.length ? Math.max(...durations) : 0
  const shortest = durations.length ? Math.min(...durations) : 0
  const successRate = sessions.length ? Math.round((completed.length / sessions.length) * 100) : 0
  const averageSessionDuration = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0
  const productiveDay = [...days.entries()].sort((a, b) => (b[1].completed - b[1].abandoned) - (a[1].completed - a[1].abandoned))[0]
  const goalsCompletedThisWeek = await prisma.goal.count({ where: { completedAt: { gte: start, lt: end }, status: 'COMPLETED', userId } })

  return {
    achievements,
    achievementsUnlocked,
    abandonedSessions: abandoned.length,
    averageSessionDuration,
    bestFocusDay: focusDays.best,
    bestFocusMinutes: focusDays.bestMinutes,
    bestStreak: streak.bestStreak || 0,
    completedSessions: completed.length,
    consumption,
    consumptionScore: consumption.healthyConsumptionScore || 0,
    currentStreak: streak.currentStreak || 0,
    discipline,
    focusHours: Number((focusMinutes / 60).toFixed(1)),
    focusMinutes,
    goals,
    goalsCompletedThisWeek,
    identity,
    longestSession: longest,
    missionSuccessRate: successRate,
    mostProductiveDay: productiveDay ? dayLabel(new Date(`${productiveDay[0]}T00:00:00.000Z`)) : 'None',
    rankProgress: discipline.progressPercentage || discipline.progressToNextRank || 0,
    scoreEventsXp: scoreEvents._sum.points || 0,
    shortestSession: shortest,
    timeSaved: consumption.timeSaved || consumption.timeSavedText || '0m',
    totalSessions: sessions.length,
    videosWatched: consumption.totalVideos || 0,
    weeklyMinutesConsumed: consumption.totalMinutes || 0,
    worstFocusDay: focusDays.worst,
  }
}

function calculateOverallScore(stats) {
  return clamp(
    stats.missionSuccessRate * 0.25 +
    clamp((stats.focusHours / 14) * 100) * 0.20 +
    clamp((stats.currentStreak / 7) * 100) * 0.15 +
    stats.consumptionScore * 0.15 +
    clamp((stats.goalsCompletedThisWeek / 2) * 100) * 0.10 +
    clamp((stats.achievementsUnlocked.length / 2) * 100) * 0.05 +
    (stats.identity?.identityScore || 0) * 0.10,
  )
}

function buildInsights(stats, score) {
  const insights = []
  if (stats.missionSuccessRate >= 85) insights.push('Excellent consistency this week. You completed most of what you started.')
  if (stats.missionSuccessRate < 60 && stats.totalSessions > 0) insights.push('Mission abandonment increased and needs attention next week.')
  if (stats.focusHours >= 10) insights.push('Focus duration was strong and deep work momentum improved.')
  if (stats.focusHours === 0) insights.push('No focus sessions were completed this week. Start with one short mission.')
  if (stats.consumptionScore >= 80) insights.push('Consumption remained under control and supported your discipline.')
  if (stats.consumptionScore < 60) insights.push('Short-form consumption created friction for your focus this week.')
  if (stats.goalsCompletedThisWeek > 0) insights.push('You converted daily discipline into long-term goal progress.')
  if (stats.goalsCompletedThisWeek === 0 && stats.goals.activeGoals > 0) insights.push('Goal progress slowed this week despite active goals.')
  if (stats.achievementsUnlocked.length > 0) insights.push('You unlocked new achievements that now permanently strengthen your identity.')
  if (score >= 85) insights.push('This was a high-discipline week across multiple systems.')
  return insights.slice(0, 6)
}

function buildRecommendations(stats) {
  const recommendations = []
  if (stats.abandonedSessions > 0) recommendations.push('Reduce abandoned missions by planning shorter, clearer focus blocks.')
  if (stats.focusHours < 5) recommendations.push('Create one more daily mission to rebuild focus volume.')
  if (stats.averageSessionDuration < 25 && stats.completedSessions > 0) recommendations.push('Increase mission duration gradually to build deeper work capacity.')
  if (stats.currentStreak > 0) recommendations.push('Maintain your current streak with one non-negotiable mission tomorrow.')
  if (stats.consumptionScore < 80) recommendations.push('Limit short-form content before focus sessions to protect attention.')
  if (stats.goals.activeGoals > 0 && stats.goalsCompletedThisWeek === 0) recommendations.push('Pick one active goal and connect it to a mission next week.')
  if (recommendations.length === 0) recommendations.push('Keep the system stable: repeat this week with slightly higher focus duration.')
  return recommendations.slice(0, 5)
}

function buildHighlights(stats) {
  const biggestAchievement = stats.achievementsUnlocked[0]?.achievement?.title || 'No achievement unlocked this week'
  return {
    bestFocusDay: stats.bestFocusDay,
    biggestAchievement,
    identityProgress: stats.identity?.currentTitle || 'Discipline Beginner',
    longestDeepWorkSession: `${stats.longestSession}m`,
    mostImprovedMetric: stats.focusHours >= 10 ? 'Focus Hours' : stats.missionSuccessRate >= 80 ? 'Mission Reliability' : 'Consistency',
    mostProductiveDay: stats.mostProductiveDay,
    strongestTrait: stats.identity?.strongestTrait?.name || stats.identity?.strongestTrait || 'Not enough data',
  }
}

async function buildWeeklyReview(userId, query = {}) {
  const { start, end } = parseWeekRange(query)
  const stats = await getWeeklyStats(userId, start, end)
  const overallScore = calculateOverallScore(stats)
  const grade = gradeForScore(overallScore)
  const week = {
    endDate: dateKey(addDays(end, -1)),
    range: displayRange(start, end),
    startDate: dateKey(start),
  }
  const statistics = {
    abandonedSessions: stats.abandonedSessions,
    achievementsUnlocked: stats.achievementsUnlocked.length,
    averageSessionDuration: stats.averageSessionDuration,
    bestFocusDay: stats.bestFocusDay,
    bestStreak: stats.bestStreak,
    completedSessions: stats.completedSessions,
    consumptionScore: stats.consumptionScore,
    currentStreak: stats.currentStreak,
    focusHours: stats.focusHours,
    focusMinutes: stats.focusMinutes,
    goalsCompleted: stats.goalsCompletedThisWeek,
    healthyConsumptionDays: stats.consumption.trend?.filter((day) => day.score >= 80).length || 0,
    longestSession: stats.longestSession,
    missionSuccessRate: stats.missionSuccessRate,
    rankProgress: stats.rankProgress,
    shortestSession: stats.shortestSession,
    timeSaved: stats.timeSaved,
    videosWatched: stats.videosWatched,
    worstFocusDay: stats.worstFocusDay,
    xpEarned: stats.scoreEventsXp,
  }

  return {
    achievements: {
      unlocked: stats.achievementsUnlocked.map((ua) => ({
        code: ua.achievement.code,
        rarity: ua.achievement.rarity,
        title: ua.achievement.title,
        unlockedAt: ua.unlockedAt,
        xpReward: ua.achievement.xpReward,
      })),
      unlockedCount: stats.achievementsUnlocked.length,
      xpRewards: stats.achievementsUnlocked.reduce((sum, ua) => sum + ua.achievement.xpReward, 0),
    },
    grade,
    goals: {
      activeGoals: stats.goals.activeGoals,
      averageProgress: stats.goals.averageProgress,
      completedThisWeek: stats.goalsCompletedThisWeek,
      upcomingGoals: stats.goals.upcomingDeadlines || [],
    },
    highlights: buildHighlights(stats),
    identity: {
      after: stats.identity?.currentTitle || 'Discipline Beginner',
      before: stats.identity?.currentTitle || 'Discipline Beginner',
      changed: false,
      currentRank: stats.discipline.currentRank || 'D',
      score: stats.identity?.identityScore || 0,
      title: stats.identity?.currentTitle || 'Discipline Beginner',
      trait: stats.identity?.strongestTrait,
    },
    insights: buildInsights(stats, overallScore),
    overallScore,
    recommendations: buildRecommendations(stats),
    statistics,
    summaryMessage: `Grade ${grade}. ${stats.completedSessions} missions completed, ${stats.focusHours}h focused, and ${stats.missionSuccessRate}% mission success this week.`,
    week,
  }
}

async function getCurrentReview(userId, query = {}) {
  return buildWeeklyReview(userId, query)
}

async function getHistory(userId) {
  const today = startOfUtcDay()
  const summaries = []
  for (let index = 0; index < 6; index += 1) {
    const end = addDays(addDays(today, 1), -index * 7)
    const start = addDays(end, -7)
    const review = await buildWeeklyReview(userId, { startDate: dateKey(start), endDate: dateKey(addDays(end, -1)) })
    summaries.push({
      endDate: review.week.endDate,
      grade: review.grade,
      overallScore: review.overallScore,
      range: review.week.range,
      startDate: review.week.startDate,
      summaryMessage: review.summaryMessage,
    })
  }
  return summaries
}

async function getWeekReview(userId, weekStart) {
  const start = new Date(`${weekStart}T00:00:00.000Z`)
  const end = addDays(start, 6)
  return buildWeeklyReview(userId, { startDate: dateKey(start), endDate: dateKey(end) })
}

async function generateReview(userId, query = {}) {
  return buildWeeklyReview(userId, query)
}

module.exports = {
  generateReview,
  getCurrentReview,
  getHistory,
  getWeekReview,
}
