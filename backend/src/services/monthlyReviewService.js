const prisma = require("../config/prisma");
const { getAchievementSummary } = require("./achievementService");
const { getConsumptionAnalytics } = require("./analyticsService");
const { getDisciplineScore } = require("./disciplineScoreService");
const { getGoalSummary } = require("./goalService");
const {
  getProgression,
  getSummary: getIdentitySummary,
} = require("./identityService");
const { getCalendarMonth, getStreakSummary } = require("./streakService");

const MS_PER_DAY = 86400000;

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function startOfMonth(month, year) {
  return new Date(Date.UTC(year, month - 1, 1));
}

function endOfMonthExclusive(month, year) {
  return new Date(Date.UTC(year, month, 1));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(month, year) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(startOfMonth(month, year));
}

function previousMonth(month, year) {
  return month === 1
    ? { month: 12, year: year - 1 }
    : { month: month - 1, year };
}

function sessionMinutes(session) {
  return (
    session.actualDurationMinutes ||
    Math.round((session.elapsedSeconds || 0) / 60)
  );
}

function gradeForScore(score) {
  if (score >= 95) return "S+";
  if (score >= 88) return "S";
  if (score >= 78) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function dayLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function weekLabel(start, end) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(start)} - ${fmt.format(new Date(end.getTime() - MS_PER_DAY))}`;
}

async function getMonthSessions(userId, month, year) {
  const start = startOfMonth(month, year);
  const end = endOfMonthExclusive(month, year);
  return prisma.missionSession.findMany({
    include: { mission: true },
    orderBy: { endedAt: "asc" },
    where: {
      endedAt: { gte: start, lt: end },
      status: { in: ["COMPLETED", "ABANDONED"] },
      userId,
    },
  });
}

function groupSessionsByDay(sessions) {
  const days = new Map();
  sessions.forEach((session) => {
    const date = dateKey(
      session.endedAt || session.completedAt || session.startedAt,
    );
    const current = days.get(date) || {
      abandoned: 0,
      completed: 0,
      focusMinutes: 0,
      sessions: 0,
      xp: 0,
    };
    current.sessions += 1;
    if (session.status === "COMPLETED") {
      current.completed += 1;
      current.focusMinutes += sessionMinutes(session);
    }
    if (session.status === "ABANDONED") current.abandoned += 1;
    days.set(date, current);
  });
  return days;
}

function productiveDays(days) {
  if (days.size === 0)
    return { best: "None", bestFocusDay: "None", least: "None" };
  const entries = [...days.entries()];
  const byFocus = [...entries].sort(
    (a, b) => b[1].focusMinutes - a[1].focusMinutes,
  );
  const byProductivity = [...entries].sort(
    (a, b) =>
      b[1].completed * 2 +
      b[1].focusMinutes / 60 -
      b[1].abandoned -
      (a[1].completed * 2 + a[1].focusMinutes / 60 - a[1].abandoned),
  );
  return {
    best: dayLabel(new Date(`${byProductivity[0][0]}T00:00:00.000Z`)),
    bestFocusDay: dayLabel(new Date(`${byFocus[0][0]}T00:00:00.000Z`)),
    least: dayLabel(
      new Date(`${byProductivity[byProductivity.length - 1][0]}T00:00:00.000Z`),
    ),
  };
}

function mostProductiveWeek(sessions, month, year) {
  const monthStart = startOfMonth(month, year);
  const monthEnd = endOfMonthExclusive(month, year);
  const weeks = [];
  let cursor = new Date(monthStart);
  while (cursor < monthEnd) {
    const start = new Date(cursor);
    const end = new Date(
      Math.min(addDays(start, 7).getTime(), monthEnd.getTime()),
    );
    const focusMinutes = sessions
      .filter(
        (session) =>
          session.status === "COMPLETED" &&
          session.endedAt >= start &&
          session.endedAt < end,
      )
      .reduce((sum, session) => sum + sessionMinutes(session), 0);
    weeks.push({ end, focusMinutes, start });
    cursor = end;
  }
  const best = weeks.sort((a, b) => b.focusMinutes - a.focusMinutes)[0];
  return best ? weekLabel(best.start, best.end) : "None";
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

async function getMonthStats(userId, month, year) {
  const start = startOfMonth(month, year);
  const end = endOfMonthExclusive(month, year);
  const [
    sessions,
    streak,
    streakCalendar,
    discipline,
    goals,
    achievements,
    identity,
    progression,
    consumption,
    scoreEvents,
    achievementsUnlocked,
    goalsCompleted,
    overdueGoals,
  ] = await Promise.all([
    getMonthSessions(userId, month, year),
    getStreakSummary(userId),
    getCalendarMonth(userId, month, year),
    getDisciplineScore(userId),
    getGoalSummary(userId),
    getAchievementSummary(userId),
    getIdentitySummary(userId),
    getProgression(userId),
    getConsumptionAnalytics(userId, { month, year }),
    prisma.disciplineScoreEvent.aggregate({
      _sum: { points: true },
      where: { createdAt: { gte: start, lt: end }, userId },
    }),
    prisma.userAchievement.findMany({
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
      where: { completed: true, unlockedAt: { gte: start, lt: end }, userId },
    }),
    prisma.goal.findMany({
      where: {
        completedAt: { gte: start, lt: end },
        status: "COMPLETED",
        userId,
      },
    }),
    prisma.goal.count({
      where: {
        archived: false,
        status: { not: "COMPLETED" },
        targetDate: { lt: new Date() },
        userId,
      },
    }),
  ]);

  const completed = sessions.filter(
    (session) => session.status === "COMPLETED",
  );
  const abandoned = sessions.filter(
    (session) => session.status === "ABANDONED",
  );
  const durations = completed
    .map(sessionMinutes)
    .filter((duration) => duration > 0);
  const focusMinutes = durations.reduce((sum, duration) => sum + duration, 0);
  const days = groupSessionsByDay(sessions);
  const productDays = productiveDays(days);
  const daysInMonth = Math.round((end - start) / MS_PER_DAY);
  const focusDays = [...days.values()].filter(
    (day) => day.focusMinutes > 0,
  ).length;
  const trend = consumption.trend || [];
  const healthyConsumptionDays = trend.filter((day) => day.score >= 80).length;
  const limitReachedDays = trend.filter((day) => day.score < 50).length;
  const completedStreakDays = (streakCalendar.days || []).filter(
    (day) => day.state === "COMPLETED",
  ).length;
  const missedStreakDays = (streakCalendar.days || []).filter(
    (day) => day.state === "MISSED",
  ).length;

  return {
    abandonedSessions: abandoned.length,
    achievements,
    achievementsUnlocked,
    averageSessionDuration: durations.length
      ? Math.round(focusMinutes / durations.length)
      : 0,
    bestFocusDay: productDays.bestFocusDay,
    bestStreak: streak.bestStreak || 0,
    completedSessions: completed.length,
    consumption,
    completedStreakDays,
    consumptionScore: consumption.healthyConsumptionScore || 0,
    currentStreak: streak.currentStreak || 0,
    discipline,
    focusDays,
    focusHours: Number((focusMinutes / 60).toFixed(1)),
    focusMinutes,
    goals,
    goalsCompleted,
    healthyConsumptionDays,
    identity,
    inactiveDays: Math.max(0, daysInMonth - focusDays),
    leastProductiveDay: productDays.least,
    limitReachedDays,
    missedStreakDays,
    longestSession: durations.length ? Math.max(...durations) : 0,
    missionSuccessRate: sessions.length
      ? Math.round((completed.length / sessions.length) * 100)
      : 0,
    mostProductiveDay: productDays.best,
    mostProductiveWeek: mostProductiveWeek(sessions, month, year),
    overdueGoals,
    progression,
    rankProgress:
      discipline.progressPercentage || discipline.progressToNextRank || 0,
    scoreEventsXp: scoreEvents._sum.points || 0,
    sessions,
    shortestSession: durations.length ? Math.min(...durations) : 0,
    streakCalendar,
    timeSaved: consumption.timeSaved || "0m",
    totalSessions: sessions.length,
    videosWatched: consumption.totalVideos || 0,
  };
}

function calculateMonthlyScore(stats) {
  return clamp(
    stats.missionSuccessRate * 0.22 +
      clamp((stats.focusHours / 60) * 100) * 0.2 +
      clamp((stats.focusDays / 20) * 100) * 0.12 +
      stats.consumptionScore * 0.12 +
      clamp((stats.goalsCompleted.length / 4) * 100) * 0.1 +
      clamp((stats.achievementsUnlocked.length / 4) * 100) * 0.08 +
      (stats.identity?.identityScore || 0) * 0.1 +
      clamp((stats.currentStreak / 30) * 100) * 0.06,
  );
}

function comparisonValue(current, previous) {
  const absolute = Number((current - previous).toFixed(1));
  const percentage =
    previous === 0
      ? current > 0
        ? 100
        : 0
      : Math.round((absolute / previous) * 100);
  return { absolute, percentage };
}

async function buildComparison(userId, month, year, currentStats) {
  const prev = previousMonth(month, year);
  const previousStats = await getMonthStats(userId, prev.month, prev.year);
  return {
    achievementDifference: comparisonValue(
      currentStats.achievementsUnlocked.length,
      previousStats.achievementsUnlocked.length,
    ),
    consumptionDifference: comparisonValue(
      currentStats.videosWatched,
      previousStats.videosWatched,
    ),
    focusHoursDifference: comparisonValue(
      currentStats.focusHours,
      previousStats.focusHours,
    ),
    goalDifference: comparisonValue(
      currentStats.goalsCompleted.length,
      previousStats.goalsCompleted.length,
    ),
    identityChange: {
      from: previousStats.identity?.currentTitle || "Discipline Beginner",
      to: currentStats.identity?.currentTitle || "Discipline Beginner",
      changed:
        (previousStats.identity?.currentTitle || "Discipline Beginner") !==
        (currentStats.identity?.currentTitle || "Discipline Beginner"),
    },
    rankChange: {
      from: previousStats.discipline.currentRank || "D",
      to: currentStats.discipline.currentRank || "D",
      changed:
        (previousStats.discipline.currentRank || "D") !==
        (currentStats.discipline.currentRank || "D"),
    },
    sessionDifference: comparisonValue(
      currentStats.completedSessions,
      previousStats.completedSessions,
    ),
    streakChange: comparisonValue(
      currentStats.currentStreak,
      previousStats.currentStreak,
    ),
    xpDifference: comparisonValue(
      currentStats.scoreEventsXp,
      previousStats.scoreEventsXp,
    ),
  };
}

function buildInsights(stats, comparison) {
  const insights = [];
  if (comparison.focusHoursDifference.percentage > 0)
    insights.push(
      `Focus increased by ${comparison.focusHoursDifference.percentage}%.`,
    );
  if (stats.missionSuccessRate >= 80)
    insights.push("Mission completion remained strong this month.");
  if (stats.averageSessionDuration >= 50)
    insights.push("Average session duration supported deeper work.");
  if (comparison.consumptionDifference.absolute < 0)
    insights.push("Consumption decreased compared with last month.");
  if (comparison.rankChange.changed)
    insights.push("Discipline rank improved this month.");
  if (comparison.goalDifference.absolute > 0)
    insights.push("Goals completed exceeded last month.");
  if (stats.identity?.identityScore >= 70)
    insights.push("Identity became stronger through consistent execution.");
  if (stats.abandonedSessions > 0)
    insights.push("Abandoned missions show where consistency broke down.");
  if (stats.limitReachedDays > 0)
    insights.push("Limit reached days created avoidable attention leaks.");
  if (insights.length === 0)
    insights.push(
      "This month established baseline data for future improvement.",
    );
  return insights.slice(0, 7);
}

function buildRecommendations(stats) {
  const recommendations = [];
  if (stats.averageSessionDuration < 35)
    recommendations.push(
      "Increase average focus duration with slightly longer missions.",
    );
  if (stats.abandonedSessions > 0)
    recommendations.push(
      "Reduce abandoned missions by choosing realistic session lengths.",
    );
  if (stats.currentStreak > 0)
    recommendations.push(
      "Maintain your current streak with one daily non-negotiable mission.",
    );
  if (stats.goalsCompleted.length === 0)
    recommendations.push("Complete one long-term goal milestone next month.");
  if (stats.limitReachedDays > 0 || stats.consumptionScore < 80)
    recommendations.push(
      "Reduce weekend distractions and short-form consumption.",
    );
  if (stats.focusHours < 20)
    recommendations.push(
      "Increase deep work sessions to at least five focused blocks per week.",
    );
  if (stats.goals.activeGoals === 0)
    recommendations.push(
      "Create more long-term goals to connect discipline with outcomes.",
    );
  if (recommendations.length === 0)
    recommendations.push(
      "Keep the monthly system stable and raise focus hours by 10%.",
    );
  return recommendations.slice(0, 6);
}

function buildHighlights(stats) {
  const highestXpAchievement = [...stats.achievementsUnlocked].sort(
    (a, b) => b.achievement.xpReward - a.achievement.xpReward,
  )[0];
  const largestGoal = [...stats.goalsCompleted].sort(
    (a, b) => (b.targetValue || 0) - (a.targetValue || 0),
  )[0];
  return {
    bestFocusDay: stats.bestFocusDay,
    biggestAchievement:
      highestXpAchievement?.achievement?.title ||
      "No achievement unlocked this month",
    highestXpDay: stats.achievementsUnlocked.length
      ? dateKey(stats.achievementsUnlocked[0].unlockedAt)
      : "None",
    identityProgress: stats.identity?.currentTitle || "Discipline Beginner",
    largestGoalCompleted: largestGoal?.title || "No goal completed this month",
    longestDeepWorkSession: `${stats.longestSession}m`,
    mostProductiveWeek: stats.mostProductiveWeek,
    strongestTrait:
      stats.identity?.strongestTrait?.name ||
      stats.identity?.strongestTrait ||
      "Not enough data",
  };
}

async function buildMonthlyReview(userId, query = {}) {
  const now = new Date();
  const month = Number(query.month || now.getUTCMonth() + 1);
  const year = Number(query.year || now.getUTCFullYear());
  const stats = await getMonthStats(userId, month, year);
  const comparison = await buildComparison(userId, month, year, stats);
  const overallScore = calculateMonthlyScore(stats);
  const grade = gradeForScore(overallScore);

  return {
    achievements: {
      completionPercentage: stats.achievements.completionPercentage,
      unlocked: stats.achievementsUnlocked.map((ua) => ({
        code: ua.achievement.code,
        rarity: ua.achievement.rarity,
        title: ua.achievement.title,
        unlockedAt: ua.unlockedAt,
        xpReward: ua.achievement.xpReward,
      })),
      unlockedCount: stats.achievementsUnlocked.length,
      xpRewards: stats.achievementsUnlocked.reduce(
        (sum, ua) => sum + ua.achievement.xpReward,
        0,
      ),
    },
    comparison,
    goals: {
      activeGoals: stats.goals.activeGoals,
      averageProgress: stats.goals.averageProgress,
      completed: stats.goalsCompleted.map((goal) => ({
        id: goal.id,
        title: goal.title,
        completedAt: goal.completedAt,
      })),
      completedCount: stats.goalsCompleted.length,
      overdueGoals: stats.overdueGoals,
      upcomingGoals: stats.goals.upcomingDeadlines || [],
    },
    grade,
    highlights: buildHighlights(stats),
    identity: {
      currentRank: stats.discipline.currentRank || "D",
      progression: comparison.identityChange,
      score: stats.identity?.identityScore || 0,
      strongestTrait: stats.identity?.strongestTrait,
      title: stats.identity?.currentTitle || "Discipline Beginner",
      weakestTrait: stats.identity?.weakestTrait,
    },
    insights: buildInsights(stats, comparison),
    month,
    monthLabel: monthLabel(month, year),
    overallScore,
    recommendations: buildRecommendations(stats),
    statistics: {
      abandonedSessions: stats.abandonedSessions,
      achievementsUnlocked: stats.achievementsUnlocked.length,
      averageSessionDuration: stats.averageSessionDuration,
      bestFocusDay: stats.bestFocusDay,
      bestStreak: stats.bestStreak,
      completedDays: stats.completedStreakDays,
      completedSessions: stats.completedSessions,
      consumptionScore: stats.consumptionScore,
      currentStreak: stats.currentStreak,
      focusDays: stats.focusDays,
      healthyConsumptionDays: stats.healthyConsumptionDays,
      inactiveDays: stats.inactiveDays,
      leastProductiveDay: stats.leastProductiveDay,
      limitReachedDays: stats.limitReachedDays,
      longestSession: stats.longestSession,
      missedDays: stats.missedStreakDays,
      missionSuccessRate: stats.missionSuccessRate,
      mostProductiveDay: stats.mostProductiveDay,
      rankProgress: stats.rankProgress,
      shortestSession: stats.shortestSession,
      timeSaved: stats.timeSaved,
      totalFocusHours: stats.focusHours,
      totalFocusMinutes: stats.focusMinutes,
      videosWatched: stats.videosWatched,
      xpEarned: stats.scoreEventsXp,
    },
    summaryMessage: `Grade ${grade}. ${stats.completedSessions} missions completed, ${stats.focusHours}h focused, and ${stats.missionSuccessRate}% mission success in ${monthLabel(month, year)}.`,
    year,
  };
}

async function getCurrentReview(userId, query = {}) {
  return buildMonthlyReview(userId, query);
}

async function getHistory(userId) {
  const now = new Date();
  const items = [];
  let month = now.getUTCMonth() + 1;
  let year = now.getUTCFullYear();
  for (let i = 0; i < 6; i += 1) {
    const review = await buildMonthlyReview(userId, { month, year });
    items.push({
      grade: review.grade,
      month,
      monthLabel: review.monthLabel,
      overallScore: review.overallScore,
      summaryMessage: review.summaryMessage,
      year,
    });
    const prev = previousMonth(month, year);
    month = prev.month;
    year = prev.year;
  }
  return items;
}

async function getMonthlyReview(userId, year, month) {
  return buildMonthlyReview(userId, { month, year });
}

async function generateReview(userId, query = {}) {
  return buildMonthlyReview(userId, query);
}

module.exports = {
  generateReview,
  getCurrentReview,
  getHistory,
  getMonthlyReview,
};
