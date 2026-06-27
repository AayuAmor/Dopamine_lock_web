const prisma = require("../config/prisma");
const {
  getConsumptionSummary,
  getPlatformUsage,
  getTimeline,
  getUserLimits,
  getWeeklyAnalytics,
} = require("./consumptionService");
const {
  getDisciplineScore,
  getScoreBreakdown,
  getScoreTrend,
} = require("./disciplineScoreService");
const { getGoalSummary } = require("./goalService");
const {
  getCalendarMonth,
  getStreakSummary,
  getWeeklyConsistency,
} = require("./streakService");

const MS_PER_DAY = 86400000;

function startOfUtcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatHours(minutes) {
  return Number((Math.max(0, minutes || 0) / 60).toFixed(1));
}

function formatHoursText(minutes) {
  return `${formatHours(minutes)}h`;
}

function formatMinutesText(minutes) {
  const safe = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function getRange(query = {}, fallbackDays = null) {
  const now = new Date();
  let start;
  let end;

  if (query.month || query.year) {
    const month = Number(query.month || now.getUTCMonth() + 1);
    const year = Number(query.year || now.getUTCFullYear());
    start = new Date(Date.UTC(year, month - 1, 1));
    end = new Date(Date.UTC(year, month, 1));
  } else if (query.startDate || query.endDate) {
    start = query.startDate
      ? startOfUtcDay(new Date(query.startDate))
      : startOfUtcDay(addDays(now, -(fallbackDays || 30) + 1));
    end = query.endDate
      ? addDays(startOfUtcDay(new Date(query.endDate)), 1)
      : addDays(startOfUtcDay(now), 1);
  } else if (fallbackDays) {
    end = addDays(startOfUtcDay(now), 1);
    start = addDays(end, -fallbackDays);
  } else {
    start = null;
    end = null;
  }

  return { end, start };
}

function dayName(key) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(`${key}T00:00:00.000Z`),
  );
}

function buildDayBuckets(start, days) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    return { date, key: dateKey(date), minutes: 0, completed: 0, abandoned: 0 };
  });
}

function sessionMinutes(session) {
  return Math.max(
    0,
    session.actualDurationMinutes ||
      Math.round((session.elapsedSeconds || 0) / 60),
  );
}

async function getSessionStats(userId, range = {}) {
  const where = {
    status: { in: ["COMPLETED", "ABANDONED"] },
    userId,
  };

  if (range.start || range.end) {
    where.startedAt = {};
    if (range.start) where.startedAt.gte = range.start;
    if (range.end) where.startedAt.lt = range.end;
  }

  const sessions = await prisma.missionSession.findMany({
    include: {
      mission: {
        select: {
          difficulty: true,
          durationMinutes: true,
          id: true,
          title: true,
        },
      },
    },
    orderBy: { startedAt: "asc" },
    where,
  });
  const completed = sessions.filter(
    (session) => session.status === "COMPLETED",
  );
  const abandoned = sessions.filter(
    (session) => session.status === "ABANDONED",
  );
  const focusMinutes = completed.reduce(
    (sum, session) => sum + sessionMinutes(session),
    0,
  );
  const completedSessions = completed.length;
  const abandonedSessions = abandoned.length;
  const totalSessions = completedSessions + abandonedSessions;

  return {
    abandonedSessions,
    averageDuration: completedSessions
      ? Math.round(focusMinutes / completedSessions)
      : 0,
    completedSessions,
    focusMinutes,
    missionSuccessRate: totalSessions
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0,
    sessions,
    totalSessions,
  };
}

async function getMissionStats(userId, range = {}) {
  const missions = await prisma.mission.findMany({
    include: {
      sessions: {
        select: {
          actualDurationMinutes: true,
          elapsedSeconds: true,
          status: true,
          startedAt: true,
        },
        where:
          range.start || range.end
            ? {
                startedAt: {
                  ...(range.start ? { gte: range.start } : {}),
                  ...(range.end ? { lt: range.end } : {}),
                },
              }
            : undefined,
      },
    },
    where: { userId },
  });
  const completedMissions = missions.filter(
    (mission) => mission.completedSessionCount > 0,
  ).length;
  const abandonedMissions = missions.filter(
    (mission) =>
      mission.abandonedSessionCount > 0 && mission.completedSessionCount === 0,
  ).length;
  const totalMissions = missions.length;
  const favorite = [...missions].sort(
    (a, b) =>
      b.completedSessionCount +
      b.abandonedSessionCount -
      (a.completedSessionCount + a.abandonedSessionCount),
  )[0];
  const difficultyCounts = missions.reduce(
    (map, mission) =>
      map.set(mission.difficulty, (map.get(mission.difficulty) || 0) + 1),
    new Map(),
  );
  const mostUsedDifficulty =
    [...difficultyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "None";
  const completedDurations = missions.flatMap((mission) =>
    mission.sessions
      .filter((session) => session.status === "COMPLETED")
      .map(sessionMinutes),
  );
  const averageCompletionTime = completedDurations.length
    ? Math.round(
        completedDurations.reduce((sum, value) => sum + value, 0) /
          completedDurations.length,
      )
    : 0;

  return {
    abandonedMissions,
    averageCompletionTime,
    averageCompletionTimeText: formatMinutesText(averageCompletionTime),
    completedMissions,
    completionRate: totalMissions
      ? Math.round((completedMissions / totalMissions) * 100)
      : 0,
    favoriteMission: favorite?.title || "None",
    mostUsedDifficulty,
    totalMissions,
  };
}

async function getConsumptionStats(userId, range = {}) {
  const where = { userId };
  if (range.start || range.end) {
    where.consumedAt = {};
    if (range.start) where.consumedAt.gte = range.start;
    if (range.end) where.consumedAt.lt = range.end;
  }
  const [logs, summary, limits, platforms, timeline, weekly] =
    await Promise.all([
      prisma.consumptionLog.findMany({ include: { platform: true }, where }),
      getConsumptionSummary(userId),
      getUserLimits(userId),
      getPlatformUsage(userId),
      getTimeline(userId),
      getWeeklyAnalytics(userId),
    ]);
  const totalVideos = logs.reduce((sum, log) => sum + log.videosWatched, 0);
  const totalMinutes = logs.reduce((sum, log) => sum + log.minutesConsumed, 0);
  const rangeDays =
    range.start && range.end
      ? Math.max(1, Math.round((range.end - range.start) / MS_PER_DAY))
      : 7;
  const byPlatform = logs.reduce((map, log) => {
    const current = map.get(log.platform.name) || { minutes: 0, videos: 0 };
    current.minutes += log.minutesConsumed;
    current.videos += log.videosWatched;
    map.set(log.platform.name, current);
    return map;
  }, new Map());
  const mostUsedPlatform =
    [...byPlatform.entries()].sort(
      (a, b) => b[1].videos - a[1].videos,
    )[0]?.[0] || "None";
  const videoLimit = (limits.global?.maxVideosPerDay || 40) * rangeDays;
  const videosAvoided = Math.max(0, videoLimit - totalVideos);
  const timeSaved = videosAvoided * 2;

  return {
    averageDailyConsumption: rangeDays
      ? Math.round(totalVideos / rangeDays)
      : 0,
    healthyConsumptionScore: summary.dailyConsumptionScore,
    mostUsedPlatform,
    platformBreakdown: platforms.map((platform) => ({
      name: platform.platformName,
      minutes: platform.minutesConsumed,
      videos: platform.videosWatched,
    })),
    timeSaved,
    timeSavedText: formatMinutesText(timeSaved),
    totalMinutes,
    totalVideos,
    trend: timeline.map((item) => ({
      date: item.date,
      minutes: item.totalMinutes,
      score: item.score,
      videos: item.totalVideos,
    })),
    videosAvoided,
    weekly,
  };
}

async function getFocusAnalytics(userId) {
  const end = addDays(startOfUtcDay(), 1);
  const start = addDays(end, -7);
  const stats = await getSessionStats(userId, { start, end });
  const buckets = buildDayBuckets(start, 7);
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  stats.sessions.forEach((session) => {
    const key = dateKey(startOfUtcDay(session.startedAt));
    const bucket = byKey.get(key);
    if (!bucket) return;
    if (session.status === "COMPLETED") {
      bucket.completed += 1;
      bucket.minutes += sessionMinutes(session);
    } else if (session.status === "ABANDONED") {
      bucket.abandoned += 1;
    }
  });

  const trend = buckets.map((bucket) => ({
    date: bucket.key,
    hours: formatHours(bucket.minutes),
    minutes: bucket.minutes,
  }));
  const completedBuckets = buckets.filter((bucket) => bucket.minutes > 0);
  const best = [...completedBuckets].sort((a, b) => b.minutes - a.minutes)[0];
  const worst = [...completedBuckets].sort((a, b) => a.minutes - b.minutes)[0];

  return {
    analytics: {
      patterns: [],
      recommendationsPlaceholder: [],
      summary: `${formatHoursText(stats.focusMinutes)} focused across ${stats.completedSessions} completed sessions in the last 7 days.`,
    },
    averageDuration: stats.averageDuration,
    bestFocusDay: best ? dayName(best.key) : "None",
    completedSessions: stats.completedSessions,
    focusHours: trend.map((item) => item.hours),
    focusMinutes: trend.map((item) => item.minutes),
    sessionTrend: buckets.map((bucket) => ({
      date: bucket.key,
      abandoned: bucket.abandoned,
      completed: bucket.completed,
    })),
    totalFocusHours: formatHours(stats.focusMinutes),
    trend,
    worstFocusDay: worst ? dayName(worst.key) : "None",
  };
}

async function getOverview(userId, query = {}) {
  const range = getRange(query);
  const [sessions, streak, discipline, consumption, goals] = await Promise.all([
    getSessionStats(userId, range),
    getStreakSummary(userId),
    getDisciplineScore(userId),
    getConsumptionStats(userId, range),
    getGoalSummary(userId),
  ]);
  const firstSession = sessions.sessions[0];
  const lastSession = sessions.sessions[sessions.sessions.length - 1];
  const days =
    firstSession && lastSession
      ? Math.max(
          1,
          Math.round(
            (startOfUtcDay(lastSession.startedAt) -
              startOfUtcDay(firstSession.startedAt)) /
              MS_PER_DAY,
          ) + 1,
        )
      : 1;

  return {
    abandonedSessions: sessions.abandonedSessions,
    averageFocusDuration: sessions.averageDuration,
    averageSessionsPerDay: Number((sessions.totalSessions / days).toFixed(1)),
    bestStreak: streak.bestStreak,
    completedSessions: sessions.completedSessions,
    currentStreak: streak.currentStreak,
    disciplineRank: discipline.currentRank,
    healthyConsumptionScore: consumption.healthyConsumptionScore,
    missionSuccessRate: sessions.missionSuccessRate,
    totalFocusHours: formatHours(sessions.focusMinutes),
    totalGoals: goals.totalGoals,
    completedGoals: goals.completedGoals,
    averageGoalProgress: goals.averageProgress,
    upcomingDeadlines: goals.upcomingDeadlines,
  };
}

async function getDashboard(userId) {
  const todayStart = startOfUtcDay();
  const todayEnd = addDays(todayStart, 1);
  const [
    currentSession,
    today,
    week,
    streak,
    discipline,
    consumption,
    missions,
    goals,
  ] = await Promise.all([
    prisma.missionSession.findFirst({
      include: { mission: true },
      where: { status: { in: ["ACTIVE", "PAUSED"] }, userId },
      orderBy: { startedAt: "desc" },
    }),
    getSessionStats(userId, { start: todayStart, end: todayEnd }),
    getFocusAnalytics(userId),
    getStreakSummary(userId),
    getDisciplineScore(userId),
    getConsumptionSummary(userId),
    prisma.mission.count({ where: { userId } }),
    getGoalSummary(userId),
  ]);

  return {
    bestStreak: streak.bestStreak,
    currentMission: currentSession
      ? {
          id: currentSession.id,
          remainingSeconds: currentSession.remainingSeconds,
          title: currentSession.mission?.title || "Mission",
        }
      : null,
    currentRank: discipline.currentRank,
    currentStreak: streak.currentStreak,
    disciplineScore: discipline,
    goalSummary: goals,
    quickStatistics: {
      activeGoals: goals.activeGoals,
      averageGoalProgress: goals.averageProgress,
      completionRate: streak.completionRate,
      nextMilestone: streak.nextMilestone,
      totalMissions: missions,
      weeklyCompletedSessions: week.completedSessions,
    },
    todayConsumptionScore: consumption.dailyConsumptionScore,
    todayFocus: formatHours(today.focusMinutes),
    todaySessions: today.completedSessions + today.abandonedSessions,
    weeklyFocusHours: week.trend,
  };
}

async function getMissionAnalytics(userId, query = {}) {
  return getMissionStats(userId, getRange(query));
}

async function getConsumptionAnalytics(userId, query = {}) {
  const stats = await getConsumptionStats(userId, getRange(query, 7));
  return {
    averageDailyConsumption: stats.averageDailyConsumption,
    healthyConsumptionScore: stats.healthyConsumptionScore,
    mostUsedPlatform: stats.mostUsedPlatform,
    platformBreakdown: stats.platformBreakdown,
    timeSaved: stats.timeSavedText,
    totalMinutes: stats.totalMinutes,
    totalVideos: stats.totalVideos,
    trend: stats.trend,
    videosAvoided: stats.videosAvoided,
  };
}

async function getDisciplineAnalytics(userId) {
  const [score, trend, breakdown] = await Promise.all([
    getDisciplineScore(userId),
    getScoreTrend(userId),
    getScoreBreakdown(userId),
  ]);
  const now = new Date();
  const weekStart = addDays(startOfUtcDay(now), -6);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const [weekEvents, monthEvents] = await Promise.all([
    prisma.disciplineScoreEvent.aggregate({
      _sum: { points: true },
      where: { createdAt: { gte: weekStart }, userId },
    }),
    prisma.disciplineScoreEvent.aggregate({
      _sum: { points: true },
      where: { createdAt: { gte: monthStart }, userId },
    }),
  ]);

  return {
    currentXp: score.totalXp,
    progress: score.progressPercentage,
    rank: score.currentRank,
    scoreBreakdown: breakdown,
    xpEarnedThisMonth: monthEvents._sum.points || 0,
    xpEarnedThisWeek: weekEvents._sum.points || 0,
    xpTrend: trend.map((item) => ({ date: item.date, xp: item.score })),
  };
}

async function getStreakAnalytics(userId, query = {}) {
  const now = new Date();
  const month = Number(query.month || now.getUTCMonth() + 1);
  const year = Number(query.year || now.getUTCFullYear());
  const [summary, calendar] = await Promise.all([
    getStreakSummary(userId),
    getCalendarMonth(userId, month, year),
  ]);
  const completedDays = calendar.days.filter(
    (day) => day.state === "COMPLETED",
  ).length;
  const missedDays = calendar.days.filter(
    (day) => day.state === "MISSED",
  ).length;

  return {
    bestStreak: summary.bestStreak,
    calendarSummary: calendar.days,
    completedDays,
    consistency: summary.completionRate,
    currentStreak: summary.currentStreak,
    missedDays,
  };
}

async function getWeekly(userId) {
  const end = addDays(startOfUtcDay(), 1);
  const start = addDays(end, -7);
  const [sessions, discipline, consumption, consistency, goals] =
    await Promise.all([
      getSessionStats(userId, { start, end }),
      getDisciplineAnalytics(userId),
      getConsumptionAnalytics(userId, {
        startDate: dateKey(start),
        endDate: dateKey(addDays(end, -1)),
      }),
      getWeeklyConsistency(userId),
      getGoalSummary(userId),
    ]);
  const focus = await getFocusAnalytics(userId);
  const bestDay = focus.bestFocusDay;
  const worstDay = focus.worstFocusDay;

  return {
    analytics: {
      patterns: [],
      recommendationsPlaceholder: [],
      summary:
        "Weekly review generated from completed missions, XP, streak and consumption records.",
    },
    bestDay,
    completionRate: sessions.missionSuccessRate,
    completed: sessions.completedSessions,
    consistency: `${consistency.percentage}%`,
    consumption,
    disciplineXp: discipline.xpEarnedThisWeek,
    failed: sessions.abandonedSessions,
    focusHours: formatHoursText(sessions.focusMinutes),
    goals,
    range: `${dateKey(start)} - ${dateKey(addDays(end, -1))}`,
    sessions: sessions.totalSessions,
    summaryMessage:
      sessions.completedSessions > sessions.abandonedSessions
        ? "Strong week. You completed more missions than you abandoned and protected meaningful focus time."
        : "This week needs a reset. Start with one short mission and rebuild momentum.",
    worstDay,
  };
}

async function getMonthly(userId, query = {}) {
  const now = new Date();
  const month = Number(query.month || now.getUTCMonth() + 1);
  const year = Number(query.year || now.getUTCFullYear());
  const range = getRange({ month, year });
  const [sessions, missions, discipline, consumption, goals] =
    await Promise.all([
      getSessionStats(userId, range),
      getMissionStats(userId, range),
      getDisciplineAnalytics(userId),
      getConsumptionAnalytics(userId, { month, year }),
      getGoalSummary(userId),
    ]);

  return {
    analytics: {
      patterns: [],
      recommendationsPlaceholder: [],
      summary:
        "Monthly review generated from the centralized analytics engine.",
    },
    averageFocus: sessions.averageDuration,
    consumption,
    currentRank: discipline.rank,
    focusHours: formatHoursText(sessions.focusMinutes),
    goals,
    missionSuccess: `${sessions.missionSuccessRate}%`,
    month: `${year}-${String(month).padStart(2, "0")}`,
    rankProgress: discipline.progress,
    sessions: sessions.totalSessions,
    summaryMessage:
      missions.completionRate >= 70
        ? "Productive month. Mission completion remained healthy and your discipline rank progressed."
        : "Mixed month. Improve consistency by reducing abandoned sessions and keeping daily missions smaller.",
    timeSaved: consumption.timeSaved,
    xpEarned: discipline.xpEarnedThisMonth,
  };
}

module.exports = {
  getConsumptionAnalytics,
  getDashboard,
  getDisciplineAnalytics,
  getFocusAnalytics,
  getMissionAnalytics,
  getMonthly,
  getOverview,
  getStreakAnalytics,
  getWeekly,
};
