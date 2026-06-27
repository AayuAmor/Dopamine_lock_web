const prisma = require('../config/prisma')
const { getAchievementSummary } = require('./achievementService')
const { getConsumptionAnalytics, getFocusAnalytics } = require('./analyticsService')
const { getConsumptionSummary } = require('./consumptionService')
const { getDisciplineScore } = require('./disciplineScoreService')
const { getGoalSummary } = require('./goalService')
const { getSummary: getIdentitySummary } = require('./identityService')
const { getCurrentSession } = require('./missionSessionService')
const { getHistory: getSessionHistory } = require('./sessionHistoryService')
const { getStreakSummary } = require('./streakService')
const { getCurrentReview: getWeeklyReview } = require('./weeklyReviewService')
const { getCurrentReview: getMonthlyReview } = require('./monthlyReviewService')

const MS_PER_DAY = 86400000

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

function formatHours(minutes) {
  return Number((Math.max(0, Number(minutes) || 0) / 60).toFixed(1))
}

function fallbackFor(section) {
  const fallbacks = {
    achievements: {
      completionPercentage: 0,
      latestAchievement: null,
      totalAchievements: 0,
      unlockedCount: 0,
    },
    analytics: {
      bestFocusDay: 'None',
      distractionsPrevented: 0,
      todayFocusMinutes: 0,
      totalTimeSaved: '0m',
      weeklyFocusHours: 0,
      weeklyFocusTrend: [],
    },
    consumption: {
      consumptionScore: 100,
      limitReached: false,
      reelsToday: 0,
      shortsToday: 0,
      timeConsumedToday: '0m',
      totalMinutesToday: 0,
      totalVideosToday: 0,
    },
    currentMission: {
      activeSession: null,
      goal: null,
      missionTitle: null,
      progressPercentage: 0,
      remainingSeconds: 0,
      status: 'NONE',
    },
    discipline: {
      currentRank: 'D',
      nextRank: 'C',
      progressPercentage: 0,
      totalXp: 0,
      xpNeeded: 200,
    },
    goals: {
      activeGoals: 0,
      averageProgress: 0,
      completedGoals: 0,
      topActiveGoal: null,
      upcomingDeadline: null,
    },
    identity: {
      currentTitle: 'Discipline Beginner',
      identityScore: 0,
      strongestTrait: null,
    },
    missionStats: {
      abandonedSessions: 0,
      archivedMissions: 0,
      completedSessions: 0,
      readyMissions: 0,
      successRate: 0,
      totalMissions: 0,
    },
    monthlyReview: {
      focusHours: 0,
      grade: 'F',
      keyInsight: 'Monthly review will appear after tracked activity.',
      monthlyScore: 0,
      xpEarned: 0,
    },
    quickActions: {
      canStartMission: false,
      hasAchievements: false,
      hasActiveMission: false,
      hasConsumptionLimits: false,
      hasGoals: false,
    },
    recentSessions: { items: [] },
    streak: {
      bestStreak: 0,
      completionRate: 0,
      currentStreak: 0,
      thisWeekCompletedDays: 0,
    },
    weeklyReview: {
      completionRate: 0,
      focusHours: 0,
      grade: 'F',
      keyInsight: 'Weekly review will appear after tracked activity.',
      weeklyScore: 0,
    },
  }
  return fallbacks[section]
}

async function optional(section, loader) {
  try {
    const value = await loader()
    return value ?? fallbackFor(section)
  } catch (error) {
    console.error(`Dashboard ${section} aggregation failed:`, error)
    return fallbackFor(section)
  }
}

function formatCurrentMission(session) {
  if (!session) return fallbackFor('currentMission')
  return {
    activeSession: session,
    goal: session.mission?.goal || null,
    missionTitle: session.mission?.title || 'Mission',
    progressPercentage: session.completionPercentage || 0,
    remainingSeconds: session.remainingSeconds || 0,
    status: session.status || 'ACTIVE',
  }
}

async function getMissionStats(userId) {
  const [totalMissions, readyMissions, archivedMissions, completedSessions, abandonedSessions] = await Promise.all([
    prisma.mission.count({ where: { userId } }),
    prisma.mission.count({ where: { archived: false, status: 'Ready', userId } }),
    prisma.mission.count({ where: { OR: [{ archived: true }, { status: 'Archived' }], userId } }),
    prisma.missionSession.count({ where: { status: 'COMPLETED', userId } }),
    prisma.missionSession.count({ where: { status: 'ABANDONED', userId } }),
  ])
  const terminalSessions = completedSessions + abandonedSessions
  return {
    abandonedSessions,
    archivedMissions,
    completedSessions,
    readyMissions,
    successRate: terminalSessions ? Math.round((completedSessions / terminalSessions) * 100) : 0,
    totalMissions,
  }
}

async function getAnalyticsSnapshot(userId) {
  const todayStart = startOfUtcDay()
  const todayEnd = addDays(todayStart, 1)
  const [todayFocus, focus, consumption] = await Promise.all([
    prisma.missionSession.aggregate({
      _sum: { actualDurationMinutes: true, elapsedSeconds: true, blockedWebsitesCount: true },
      where: { startedAt: { gte: todayStart, lt: todayEnd }, status: 'COMPLETED', userId },
    }),
    getFocusAnalytics(userId),
    getConsumptionAnalytics(userId),
  ])
  const todayFocusMinutes = todayFocus._sum.actualDurationMinutes || Math.round((todayFocus._sum.elapsedSeconds || 0) / 60)
  return {
    bestFocusDay: focus.bestFocusDay || 'None',
    distractionsPrevented: todayFocus._sum.blockedWebsitesCount || 0,
    todayFocusMinutes,
    totalTimeSaved: consumption.timeSaved || '0m',
    weeklyFocusHours: focus.totalFocusHours || 0,
    weeklyFocusTrend: focus.trend || [],
  }
}

function formatGoals(summary) {
  return {
    activeGoals: summary.activeGoals || 0,
    averageProgress: summary.averageProgress || 0,
    completedGoals: summary.completedGoals || 0,
    topActiveGoal: summary.topActiveGoal || null,
    upcomingDeadline: summary.upcomingDeadlines?.[0] || null,
  }
}

async function getLatestAchievement(userId) {
  const latest = await prisma.userAchievement.findFirst({
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
    where: { completed: true, userId },
  })
  return latest
    ? {
        id: latest.achievement.id,
        code: latest.achievement.code,
        rarity: latest.achievement.rarity,
        title: latest.achievement.title,
        unlockedAt: latest.unlockedAt,
        xpReward: latest.achievement.xpReward,
      }
    : null
}

async function getAchievements(userId) {
  const [summary, latestAchievement] = await Promise.all([
    getAchievementSummary(userId),
    getLatestAchievement(userId),
  ])
  return {
    completionPercentage: summary.completionPercentage || 0,
    latestAchievement,
    totalAchievements: summary.totalAchievements || 0,
    unlockedCount: summary.unlocked || 0,
  }
}

function formatWeeklyReview(review) {
  return {
    completionRate: review?.statistics?.missionSuccessRate || 0,
    focusHours: review?.statistics?.focusHours || 0,
    grade: review?.grade || 'F',
    keyInsight: review?.insights?.[0] || review?.summaryMessage || 'Weekly review will appear after tracked activity.',
    weeklyScore: review?.overallScore || 0,
  }
}

function formatMonthlyReview(review) {
  return {
    focusHours: review?.statistics?.totalFocusHours || 0,
    grade: review?.grade || 'F',
    keyInsight: review?.insights?.[0] || review?.summaryMessage || 'Monthly review will appear after tracked activity.',
    monthlyScore: review?.overallScore || 0,
    xpEarned: review?.statistics?.xpEarned || 0,
  }
}

async function getDashboard(userId) {
  const user = await prisma.user.findUnique({
    select: {
      avatarUrl: true,
      createdAt: true,
      email: true,
      fullName: true,
      id: true,
    },
    where: { id: userId },
  })

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const [
    currentMission,
    missionStats,
    discipline,
    streak,
    consumption,
    goals,
    achievements,
    identity,
    weeklyReview,
    monthlyReview,
    analyticsSnapshot,
    recentSessions,
    consumptionLimitCount,
  ] = await Promise.all([
    optional('currentMission', async () => formatCurrentMission(await getCurrentSession(userId))),
    optional('missionStats', () => getMissionStats(userId)),
    optional('discipline', () => getDisciplineScore(userId)),
    optional('streak', () => getStreakSummary(userId)),
    optional('consumption', async () => {
      const summary = await getConsumptionSummary(userId)
      return {
        consumptionScore: summary.dailyConsumptionScore ?? 100,
        limitReached: Boolean(summary.limitReached),
        reelsToday: summary.todaysReels || 0,
        shortsToday: summary.todaysShorts || 0,
        timeConsumedToday: summary.timeConsumed || '0m',
        totalMinutesToday: summary.totalMinutes || 0,
        totalVideosToday: summary.totalVideos || 0,
      }
    }),
    optional('goals', async () => formatGoals(await getGoalSummary(userId))),
    optional('achievements', () => getAchievements(userId)),
    optional('identity', () => getIdentitySummary(userId)),
    optional('weeklyReview', async () => formatWeeklyReview(await getWeeklyReview(userId))),
    optional('monthlyReview', async () => formatMonthlyReview(await getMonthlyReview(userId))),
    optional('analytics', () => getAnalyticsSnapshot(userId)),
    optional('recentSessions', () => getSessionHistory(userId, { limit: 3, page: 1, sort: 'Newest' })),
    optional('consumptionLimitCount', () => prisma.consumptionLimit.count({ where: { active: true, userId } })),
  ])

  const quickActions = {
    canStartMission: !currentMission.activeSession && missionStats.readyMissions > 0,
    hasAchievements: achievements.unlockedCount > 0,
    hasActiveMission: Boolean(currentMission.activeSession),
    hasConsumptionLimits: Number(consumptionLimitCount) > 0,
    hasGoals: goals.activeGoals > 0 || goals.completedGoals > 0,
  }

  return {
    achievementsSummary: achievements,
    analyticsSnapshot,
    consumptionSummary: consumption,
    currentMission,
    disciplineSummary: {
      currentRank: discipline.currentRank || 'D',
      nextRank: discipline.nextRank || null,
      progressPercentage: discipline.progressPercentage || discipline.progressToNextRank || 0,
      totalXp: discipline.totalXp || 0,
      xpNeeded: discipline.xpNeeded || 0,
    },
    goalsSummary: goals,
    missionStats,
    monthlyReviewSummary: monthlyReview,
    quickActions,
    recentSessions: recentSessions?.items || [],
    streakSummary: {
      bestStreak: streak.bestStreak || 0,
      completionRate: streak.completionRate || 0,
      currentStreak: streak.currentStreak || 0,
      thisWeekCompletedDays: streak.thisWeekCompletedDays || 0,
    },
    userSummary: {
      avatarUrl: user.avatarUrl,
      email: user.email,
      fullName: user.fullName,
      identityTitle: identity.currentTitle || 'Discipline Beginner',
      memberSince: user.createdAt,
    },
    weeklyReviewSummary: weeklyReview,
  }
}

module.exports = {
  getDashboard,
}
