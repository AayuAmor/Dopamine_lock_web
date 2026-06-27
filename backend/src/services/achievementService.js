'use strict'

const prisma = require('../config/prisma')
const { getStreakSummary } = require('./streakService')

// ---------------------------------------------------------------------------
// Rank helpers
// ---------------------------------------------------------------------------
const RANK_VALUES = { D: 0, C: 1, B: 2, A: 3, S: 4, 'S+': 5 }

function rankValue(rank) {
  return RANK_VALUES[rank] ?? 0
}

// ---------------------------------------------------------------------------
// Static achievement definitions (mirrors what is seeded in the DB)
// ---------------------------------------------------------------------------
const ACHIEVEMENT_DEFS = [
  // MISSION
  { code: 'FIRST_MISSION',   category: 'MISSION',          rarity: 'COMMON',     xpReward: 25,  icon: 'target',        title: 'First Mission', description: 'Complete your very first mission.' },
  { code: 'MISSION_STARTER', category: 'MISSION',          rarity: 'COMMON',     xpReward: 50,  icon: 'target',        title: 'Mission Starter', description: 'Complete 10 missions.' },
  { code: 'MISSION_EXPERT',  category: 'MISSION',          rarity: 'RARE',       xpReward: 150, icon: 'target',        title: 'Mission Expert', description: 'Complete 100 missions.' },
  // STREAK
  { code: 'STREAK_7',        category: 'STREAK',           rarity: 'COMMON',     xpReward: 50,  icon: 'flame',         title: '7-Day Streak', description: 'Maintain a 7-day streak.' },
  { code: 'STREAK_14',       category: 'STREAK',           rarity: 'UNCOMMON',   xpReward: 75,  icon: 'flame',         title: '14-Day Streak', description: 'Maintain a 14-day streak.' },
  { code: 'STREAK_30',       category: 'STREAK',           rarity: 'RARE',       xpReward: 150, icon: 'flame',         title: '30-Day Streak', description: 'Maintain a 30-day streak.' },
  { code: 'STREAK_60',       category: 'STREAK',           rarity: 'EPIC',       xpReward: 300, icon: 'flame',         title: '60-Day Streak', description: 'Maintain a 60-day streak.' },
  { code: 'STREAK_100',      category: 'STREAK',           rarity: 'LEGENDARY',  xpReward: 500, icon: 'flame',         title: '100-Day Streak', description: 'Maintain a 100-day streak.' },
  // FOCUS
  { code: 'FOCUS_10H',       category: 'FOCUS',            rarity: 'COMMON',     xpReward: 25,  icon: 'clock',         title: '10 Focus Hours', description: 'Accumulate 10 hours of total focus time.' },
  { code: 'FOCUS_25H',       category: 'FOCUS',            rarity: 'UNCOMMON',   xpReward: 50,  icon: 'clock',         title: '25 Focus Hours', description: 'Accumulate 25 hours of total focus time.' },
  { code: 'FOCUS_50H',       category: 'FOCUS',            rarity: 'RARE',       xpReward: 100, icon: 'clock',         title: '50 Focus Hours', description: 'Accumulate 50 hours of total focus time.' },
  { code: 'FOCUS_100H',      category: 'FOCUS',            rarity: 'EPIC',       xpReward: 200, icon: 'clock',         title: '100 Focus Hours', description: 'Accumulate 100 hours of total focus time.' },
  { code: 'FOCUS_250H',      category: 'FOCUS',            rarity: 'LEGENDARY',  xpReward: 500, icon: 'clock',         title: '250 Focus Hours', description: 'Accumulate 250 hours of total focus time.' },
  // DISCIPLINE
  { code: 'RANK_C',          category: 'DISCIPLINE',       rarity: 'COMMON',     xpReward: 30,  icon: 'gauge',         title: 'Rank C', description: 'Reach Rank C in discipline score.' },
  { code: 'RANK_B',          category: 'DISCIPLINE',       rarity: 'UNCOMMON',   xpReward: 60,  icon: 'gauge',         title: 'Rank B', description: 'Reach Rank B in discipline score.' },
  { code: 'RANK_A',          category: 'DISCIPLINE',       rarity: 'RARE',       xpReward: 100, icon: 'gauge',         title: 'Rank A', description: 'Reach Rank A in discipline score.' },
  { code: 'RANK_S',          category: 'DISCIPLINE',       rarity: 'EPIC',       xpReward: 200, icon: 'gauge',         title: 'Rank S', description: 'Reach Rank S in discipline score.' },
  { code: 'RANK_S_PLUS',     category: 'DISCIPLINE',       rarity: 'LEGENDARY',  xpReward: 500, icon: 'gauge',         title: 'Rank S+', description: 'Reach the legendary Rank S+ in discipline score.' },
  // GOALS
  { code: 'FIRST_GOAL',      category: 'GOALS',            rarity: 'COMMON',     xpReward: 25,  icon: 'check-circle',  title: 'First Goal Completed', description: 'Complete your first goal.' },
  { code: 'GOALS_5',         category: 'GOALS',            rarity: 'UNCOMMON',   xpReward: 75,  icon: 'check-circle',  title: 'Goal Achiever', description: 'Complete 5 goals.' },
  { code: 'GOALS_20',        category: 'GOALS',            rarity: 'EPIC',       xpReward: 200, icon: 'check-circle',  title: 'Goal Master', description: 'Complete 20 goals.' },
  // DIGITAL_WELLNESS
  { code: 'FIRST_DETOX',     category: 'DIGITAL_WELLNESS', rarity: 'UNCOMMON',   xpReward: 50,  icon: 'shield',        title: 'Digital Detox', description: 'Complete a digital detox goal.' },
  { code: 'HEALTHY_WEEK',    category: 'DIGITAL_WELLNESS', rarity: 'UNCOMMON',   xpReward: 75,  icon: 'shield',        title: 'Healthy Week', description: 'Maintain healthy consumption for 7 consecutive days.' },
  { code: 'NO_LIMIT_30',     category: 'DIGITAL_WELLNESS', rarity: 'RARE',       xpReward: 150, icon: 'shield',        title: 'Limit-Free Month', description: 'Go 30 days without hitting a consumption limit.' },
  // SPECIAL
  { code: 'PERFECT_WEEK',          category: 'SPECIAL', rarity: 'RARE',      xpReward: 100, icon: 'star',         title: 'Perfect Week', description: 'Complete at least 5 missions with no abandons in a week.' },
  { code: 'NO_ABANDON_30',         category: 'SPECIAL', rarity: 'EPIC',      xpReward: 150, icon: 'shield-check', title: 'No Quit Month', description: 'Zero abandoned missions in the last 30 days.' },
  { code: 'FOCUS_WARRIOR',         category: 'SPECIAL', rarity: 'EPIC',      xpReward: 200, icon: 'zap',          title: 'Focus Warrior', description: 'Complete 50 missions and accumulate 50 hours of focus.' },
  { code: 'DEEP_WORK_BEAST',       category: 'SPECIAL', rarity: 'EPIC',      xpReward: 200, icon: 'brain',        title: 'Deep Work Beast', description: 'Complete 25 missions with an average session of 90+ minutes.' },
  { code: 'DISCIPLINED_BUILDER',   category: 'SPECIAL', rarity: 'EPIC',      xpReward: 150, icon: 'trophy',       title: 'Disciplined Builder', description: 'Complete 25 missions and achieve at least Rank B.' },
  { code: 'DIGITAL_MINIMALIST',    category: 'SPECIAL', rarity: 'EPIC',      xpReward: 200, icon: 'leaf',         title: 'Digital Minimalist', description: 'Go 30 days without hitting a limit and complete a digital detox goal.' },
]

// XP required to reach each rank (used for rank progress display when locked)
const RANK_XP_REQUIRED = { C: 200, B: 400, A: 700, S: 1000, 'S+': 1500 }

// ---------------------------------------------------------------------------
// Gather all stats needed for evaluation in one DB round-trip
// ---------------------------------------------------------------------------
async function gatherUserStats(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    missionAgg,
    streakSummary,
    scoreRecord,
    goalGroups,
    digitalDetoxGoalCount,
    recentAbandonedCount,
    weekSessions,
    consumptionLast30,
    recentSessionsAvg,
  ] = await Promise.all([
    prisma.missionSession.aggregate({
      where: { userId, status: 'COMPLETED' },
      _count: { id: true },
      _sum: { actualDurationMinutes: true },
      _avg: { actualDurationMinutes: true },
    }),
    getStreakSummary(userId),
    prisma.disciplineScore.findUnique({ where: { userId } }),
    prisma.goal.groupBy({ by: ['status'], where: { userId }, _count: { id: true } }),
    prisma.goal.count({ where: { userId, status: 'COMPLETED', category: 'DIGITAL_DETOX' } }),
    prisma.missionSession.count({
      where: { userId, status: 'ABANDONED', endedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.missionSession.findMany({
      where: { userId, endedAt: { gte: sevenDaysAgo }, status: { in: ['COMPLETED', 'ABANDONED'] } },
      select: { status: true, endedAt: true, completedAt: true },
    }),
    prisma.consumptionDailySummary.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
    }),
    prisma.missionSession.aggregate({
      where: { userId, status: 'COMPLETED' },
      _avg: { actualDurationMinutes: true },
    }),
  ])

  const completedMissions = missionAgg._count.id || 0
  const totalFocusMinutes = missionAgg._sum.actualDurationMinutes || 0
  const totalFocusHours = totalFocusMinutes / 60
  const avgSessionMinutes = recentSessionsAvg._avg.actualDurationMinutes || 0
  const currentStreak = streakSummary.currentStreak || 0
  const bestStreak = streakSummary.bestStreak || 0
  const disciplineRank = scoreRecord?.currentRank || 'D'
  const totalXp = scoreRecord?.totalXp || 0

  const completedGoals = goalGroups.find((g) => g.status === 'COMPLETED')?._count.id || 0

  // Consecutive healthy consumption days from today going back (up to 7)
  const sortedConsumption = [...consumptionLast30].sort((a, b) => b.date - a.date)
  let healthyConsumptionDays7 = 0
  for (const day of sortedConsumption) {
    if (day.score >= 80) {
      healthyConsumptionDays7++
    } else {
      break
    }
    if (healthyConsumptionDays7 >= 7) break
  }

  // Days in last 30 where no limit was reached
  const noLimitReachedDays30 = consumptionLast30.filter((d) => !d.limitReached).length

  // Week session analysis
  const weekCompleted = weekSessions.filter((s) => s.status === 'COMPLETED').length
  const weekAbandoned = weekSessions.filter((s) => s.status === 'ABANDONED').length

  return {
    completedMissions,
    totalFocusHours,
    avgSessionMinutes,
    currentStreak,
    bestStreak,
    disciplineRank,
    totalXp,
    completedGoals,
    hasCompletedDigitalDetoxGoal: digitalDetoxGoalCount > 0,
    healthyConsumptionDays7,
    noLimitReachedDays30,
    abandonedLast30Days: recentAbandonedCount,
    weekCompleted,
    weekAbandoned,
  }
}

// ---------------------------------------------------------------------------
// Evaluate a single achievement against the current stats
// Returns { unlocked: boolean, progress: number 0-100 }
// ---------------------------------------------------------------------------
function evaluateAchievement(achievement, stats) {
  const {
    completedMissions,
    totalFocusHours,
    avgSessionMinutes,
    currentStreak,
    disciplineRank,
    totalXp,
    completedGoals,
    hasCompletedDigitalDetoxGoal,
    healthyConsumptionDays7,
    noLimitReachedDays30,
    abandonedLast30Days,
    weekCompleted,
    weekAbandoned,
  } = stats

  const rv = rankValue(disciplineRank)

  switch (achievement.code) {
    // ---- MISSION ----
    case 'FIRST_MISSION':
      return {
        unlocked: completedMissions >= 1,
        progress: Math.min(100, completedMissions * 100),
      }
    case 'MISSION_STARTER':
      return {
        unlocked: completedMissions >= 10,
        progress: Math.min(100, Math.round((completedMissions / 10) * 100)),
      }
    case 'MISSION_EXPERT':
      return {
        unlocked: completedMissions >= 100,
        progress: Math.min(100, Math.round((completedMissions / 100) * 100)),
      }

    // ---- STREAK ----
    case 'STREAK_7':
      return {
        unlocked: currentStreak >= 7,
        progress: Math.min(100, Math.round((currentStreak / 7) * 100)),
      }
    case 'STREAK_14':
      return {
        unlocked: currentStreak >= 14,
        progress: Math.min(100, Math.round((currentStreak / 14) * 100)),
      }
    case 'STREAK_30':
      return {
        unlocked: currentStreak >= 30,
        progress: Math.min(100, Math.round((currentStreak / 30) * 100)),
      }
    case 'STREAK_60':
      return {
        unlocked: currentStreak >= 60,
        progress: Math.min(100, Math.round((currentStreak / 60) * 100)),
      }
    case 'STREAK_100':
      return {
        unlocked: currentStreak >= 100,
        progress: Math.min(100, Math.round((currentStreak / 100) * 100)),
      }

    // ---- FOCUS ----
    case 'FOCUS_10H':
      return {
        unlocked: totalFocusHours >= 10,
        progress: Math.min(100, Math.round((totalFocusHours / 10) * 100)),
      }
    case 'FOCUS_25H':
      return {
        unlocked: totalFocusHours >= 25,
        progress: Math.min(100, Math.round((totalFocusHours / 25) * 100)),
      }
    case 'FOCUS_50H':
      return {
        unlocked: totalFocusHours >= 50,
        progress: Math.min(100, Math.round((totalFocusHours / 50) * 100)),
      }
    case 'FOCUS_100H':
      return {
        unlocked: totalFocusHours >= 100,
        progress: Math.min(100, Math.round((totalFocusHours / 100) * 100)),
      }
    case 'FOCUS_250H':
      return {
        unlocked: totalFocusHours >= 250,
        progress: Math.min(100, Math.round((totalFocusHours / 250) * 100)),
      }

    // ---- DISCIPLINE (rank-based) ----
    case 'RANK_C': {
      const unlocked = rv >= rankValue('C')
      return {
        unlocked,
        progress: unlocked
          ? 100
          : Math.min(99, Math.round((totalXp / RANK_XP_REQUIRED.C) * 100)),
      }
    }
    case 'RANK_B': {
      const unlocked = rv >= rankValue('B')
      return {
        unlocked,
        progress: unlocked
          ? 100
          : Math.min(99, Math.round((totalXp / RANK_XP_REQUIRED.B) * 100)),
      }
    }
    case 'RANK_A': {
      const unlocked = rv >= rankValue('A')
      return {
        unlocked,
        progress: unlocked
          ? 100
          : Math.min(99, Math.round((totalXp / RANK_XP_REQUIRED.A) * 100)),
      }
    }
    case 'RANK_S': {
      const unlocked = rv >= rankValue('S')
      return {
        unlocked,
        progress: unlocked
          ? 100
          : Math.min(99, Math.round((totalXp / RANK_XP_REQUIRED.S) * 100)),
      }
    }
    case 'RANK_S_PLUS': {
      const unlocked = disciplineRank === 'S+'
      return {
        unlocked,
        progress: unlocked
          ? 100
          : Math.min(99, Math.round((totalXp / RANK_XP_REQUIRED['S+']) * 100)),
      }
    }

    // ---- GOALS ----
    case 'FIRST_GOAL':
      return {
        unlocked: completedGoals >= 1,
        progress: Math.min(100, completedGoals * 100),
      }
    case 'GOALS_5':
      return {
        unlocked: completedGoals >= 5,
        progress: Math.min(100, Math.round((completedGoals / 5) * 100)),
      }
    case 'GOALS_20':
      return {
        unlocked: completedGoals >= 20,
        progress: Math.min(100, Math.round((completedGoals / 20) * 100)),
      }

    // ---- DIGITAL WELLNESS ----
    case 'FIRST_DETOX':
      return {
        unlocked: hasCompletedDigitalDetoxGoal,
        progress: hasCompletedDigitalDetoxGoal ? 100 : 0,
      }
    case 'HEALTHY_WEEK':
      return {
        unlocked: healthyConsumptionDays7 >= 7,
        progress: healthyConsumptionDays7 >= 7 ? 100 : 0,
      }
    case 'NO_LIMIT_30':
      return {
        unlocked: noLimitReachedDays30 >= 30,
        progress: noLimitReachedDays30 >= 30 ? 100 : 0,
      }

    // ---- SPECIAL ----
    case 'PERFECT_WEEK': {
      const unlocked = weekAbandoned === 0 && weekCompleted >= 5
      return {
        unlocked,
        progress: unlocked ? 100 : Math.min(99, Math.round((weekCompleted / 5) * 100)),
      }
    }
    case 'NO_ABANDON_30': {
      // Progress based on how many of the last 30 days are clean (no abandons in last 30 days)
      // We know abandonedLast30Days; proxy progress as (30 - abandoned) / 30
      const cleanDays = Math.max(0, 30 - abandonedLast30Days)
      const unlocked = abandonedLast30Days === 0
      return {
        unlocked,
        progress: unlocked ? 100 : Math.min(99, Math.round((cleanDays / 30) * 100)),
      }
    }
    case 'FOCUS_WARRIOR':
      return {
        unlocked: completedMissions >= 50 && totalFocusHours >= 50,
        progress: Math.min(
          100,
          Math.round(
            (Math.min(completedMissions / 50, 1) + Math.min(totalFocusHours / 50, 1)) / 2 * 100,
          ),
        ),
      }
    case 'DEEP_WORK_BEAST':
      return {
        unlocked: completedMissions >= 25 && avgSessionMinutes >= 90,
        progress: Math.min(
          100,
          Math.round(
            (Math.min(completedMissions / 25, 1) + Math.min(avgSessionMinutes / 90, 1)) / 2 * 100,
          ),
        ),
      }
    case 'DISCIPLINED_BUILDER':
      return {
        unlocked: completedMissions >= 25 && rv >= rankValue('B'),
        progress: Math.min(
          100,
          Math.round(
            (Math.min(completedMissions / 25, 1) + Math.min(rv / rankValue('B'), 1)) / 2 * 100,
          ),
        ),
      }
    case 'DIGITAL_MINIMALIST':
      return {
        unlocked: noLimitReachedDays30 >= 30 && hasCompletedDigitalDetoxGoal,
        progress: Math.min(
          100,
          Math.round(
            (Math.min(noLimitReachedDays30 / 30, 1) + (hasCompletedDigitalDetoxGoal ? 1 : 0)) / 2 * 100,
          ),
        ),
      }

    default:
      return { unlocked: false, progress: 0 }
  }
}

// ---------------------------------------------------------------------------
// Main engine: check every achievement for a user and unlock any newly earned
// ---------------------------------------------------------------------------
async function checkAndUnlockAchievements(userId) {
  const [allAchievements, existingUserAchievements, stats] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId } }),
    gatherUserStats(userId),
  ])

  const existingMap = new Map(existingUserAchievements.map((ua) => [ua.achievementId, ua]))
  const now = new Date()
  const newlyUnlocked = []

  for (const achievement of allAchievements) {
    const existing = existingMap.get(achievement.id)

    // Skip achievements already marked completed — they stay completed forever
    if (existing?.completed) continue

    const { unlocked, progress } = evaluateAchievement(achievement, stats)

    const wasCompleted = existing?.completed ?? false
    const updateData = {
      progress,
      ...(unlocked && !wasCompleted
        ? { completed: true, unlockedAt: now }
        : {}),
    }

    await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id },
      },
      create: {
        userId,
        achievementId: achievement.id,
        progress,
        completed: unlocked,
        unlockedAt: unlocked ? now : null,
        metadata: {},
      },
      update: updateData,
    })

    if (unlocked && !wasCompleted) {
      newlyUnlocked.push({
        achievement,
        unlockedAt: now,
      })
    }
  }

  return { newlyUnlocked, allChecked: allAchievements.length }
}

// ---------------------------------------------------------------------------
// GET /achievements  — merged list for the API
// ---------------------------------------------------------------------------
async function getAchievementsForUser(userId) {
  const [allAchievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: 'asc' }, { xpReward: 'asc' }] }),
    prisma.userAchievement.findMany({ where: { userId } }),
  ])

  const userMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]))

  return allAchievements.map((achievement) => {
    const ua = userMap.get(achievement.id)
    const completed = ua?.completed ?? false
    const progress = ua?.progress ?? 0

    let state
    if (completed) state = 'Unlocked'
    else if (progress > 0) state = 'Progress'
    else state = 'Locked'

    return {
      ...achievement,
      progress,
      completed,
      unlockedAt: ua?.unlockedAt ?? null,
      state,
    }
  })
}

// ---------------------------------------------------------------------------
// Unlocked only
// ---------------------------------------------------------------------------
async function getUnlockedAchievements(userId) {
  const all = await getAchievementsForUser(userId)
  return all.filter((a) => a.completed)
}

// ---------------------------------------------------------------------------
// Locked only (includes in-progress)
// ---------------------------------------------------------------------------
async function getLockedAchievements(userId) {
  const all = await getAchievementsForUser(userId)
  return all.filter((a) => !a.completed)
}

// ---------------------------------------------------------------------------
// Single achievement detail (merged)
// ---------------------------------------------------------------------------
async function getAchievementById(userId, achievementId) {
  const [achievement, ua] = await Promise.all([
    prisma.achievement.findUnique({ where: { id: achievementId } }),
    prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    }),
  ])

  if (!achievement) return null

  const completed = ua?.completed ?? false
  const progress = ua?.progress ?? 0
  let state
  if (completed) state = 'Unlocked'
  else if (progress > 0) state = 'Progress'
  else state = 'Locked'

  return { ...achievement, progress, completed, unlockedAt: ua?.unlockedAt ?? null, state }
}

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------
async function getAchievementSummary(userId) {
  const [allAchievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({
      where: { userId, completed: true },
      include: { achievement: { select: { xpReward: true, rarity: true } } },
    }),
  ])

  const totalAchievements = allAchievements.length
  const unlocked = userAchievements.length
  const locked = totalAchievements - unlocked
  const completionPercentage = totalAchievements > 0 ? Math.round((unlocked / totalAchievements) * 100) : 0

  const legendaryUnlocked = userAchievements.filter((ua) => ua.achievement.rarity === 'LEGENDARY').length
  const epicUnlocked = userAchievements.filter((ua) => ua.achievement.rarity === 'EPIC').length
  const rareUnlocked = userAchievements.filter((ua) => ua.achievement.rarity === 'RARE').length
  const xpFromAchievements = userAchievements.reduce((sum, ua) => sum + ua.achievement.xpReward, 0)

  return {
    totalAchievements,
    unlocked,
    locked,
    completionPercentage,
    legendaryUnlocked,
    rareUnlocked,
    epicUnlocked,
    xpFromAchievements,
  }
}

// ---------------------------------------------------------------------------
// Get total achievement XP for a user (used by disciplineScoreService)
// ---------------------------------------------------------------------------
async function getAchievementXpForUser(userId) {
  const completedUserAchievements = await prisma.userAchievement.findMany({
    where: { userId, completed: true },
    include: { achievement: { select: { xpReward: true } } },
  })
  return completedUserAchievements.reduce((sum, ua) => sum + ua.achievement.xpReward, 0)
}

// ---------------------------------------------------------------------------
// Reset and re-evaluate all achievements for a user
// ---------------------------------------------------------------------------
async function recalculateAchievements(userId) {
  // Reset all user achievement records
  await prisma.userAchievement.deleteMany({ where: { userId } })
  return checkAndUnlockAchievements(userId)
}

module.exports = {
  checkAndUnlockAchievements,
  getAchievementsForUser,
  getAchievementSummary,
  getUnlockedAchievements,
  getLockedAchievements,
  getAchievementById,
  recalculateAchievements,
  getAchievementXpForUser,
  ACHIEVEMENT_DEFS,
}
