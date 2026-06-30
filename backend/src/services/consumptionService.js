const prisma = require('../config/prisma')

const defaultGlobalLimit = {
  maxMinutesPerDay: 120,
  maxVideosPerDay: 40,
  strictLockMode: true,
  warningThreshold: 80,
}

function serviceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function startOfDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

function dateKey(date) {
  return date.toISOString().slice(0, 10)
}

function formatMinutes(minutes) {
  const safeMinutes = Math.max(0, Number(minutes) || 0)
  const hours = Math.floor(safeMinutes / 60)
  const remainder = safeMinutes % 60

  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`
}

function statusForProgress(progressPercentage) {
  if (progressPercentage >= 100) return 'LIMIT_REACHED'
  if (progressPercentage >= 80) return 'WARNING'
  return 'HEALTHY'
}

function calculateConsumptionScore(totalVideos, totalMinutes, limit) {
  const healthyVideos = Math.round(limit.maxVideosPerDay * (limit.warningThreshold / 100))
  const healthyMinutes = Math.round(limit.maxMinutesPerDay * (limit.warningThreshold / 100))
  const videosOverHealthy = Math.max(0, totalVideos - healthyVideos)
  const minutesOverHealthy = Math.max(0, totalMinutes - healthyMinutes)
  const videoProgress = limit.maxVideosPerDay > 0 ? (totalVideos / limit.maxVideosPerDay) * 100 : 0
  const minuteProgress = limit.maxMinutesPerDay > 0 ? (totalMinutes / limit.maxMinutesPerDay) * 100 : 0
  const maxProgress = Math.max(videoProgress, minuteProgress)
  const warningReached = maxProgress >= limit.warningThreshold
  const limitReached = totalVideos >= limit.maxVideosPerDay || totalMinutes >= limit.maxMinutesPerDay
  let score = 100

  score -= videosOverHealthy
  score -= Math.floor(minutesOverHealthy / 5)
  if (limitReached) score -= 20
  if (warningReached) score -= 10

  return {
    limitReached,
    score: Math.max(0, Math.min(100, Math.round(score))),
    warningReached,
  }
}

function statusTextForScore(score) {
  if (score >= 80) return 'Healthy Consumption'
  if (score >= 50) return 'Warning'
  return 'Limit Reached'
}

async function getPlatforms() {
  return prisma.consumptionPlatform.findMany({
    orderBy: { id: 'asc' },
    where: { active: true },
  })
}

async function ensureGlobalLimit(userId, tx = prisma) {
  const existing = await tx.consumptionLimit.findFirst({
    where: {
      active: true,
      platformId: null,
      userId,
    },
  })

  if (existing) {
    return existing
  }

  return tx.consumptionLimit.create({
    data: {
      ...defaultGlobalLimit,
      userId,
    },
  })
}

async function getUserLimits(userId) {
  const [globalLimit, platforms, limits] = await Promise.all([
    ensureGlobalLimit(userId),
    getPlatforms(),
    prisma.consumptionLimit.findMany({
      include: { platform: true },
      where: { active: true, userId },
    }),
  ])
  const platformLimits = platforms.map((platform) => {
    const limit = limits.find((item) => item.platformId === platform.id)
    return {
      maxMinutesPerDay: limit?.maxMinutesPerDay || globalLimit.maxMinutesPerDay,
      maxVideosPerDay: limit?.maxVideosPerDay || globalLimit.maxVideosPerDay,
      platformId: platform.id,
      platformName: platform.name,
      platformSlug: platform.slug,
      strictLockMode: limit?.strictLockMode ?? globalLimit.strictLockMode,
      warningThreshold: limit?.warningThreshold || globalLimit.warningThreshold,
    }
  })

  return {
    global: {
      maxMinutesPerDay: globalLimit.maxMinutesPerDay,
      maxVideosPerDay: globalLimit.maxVideosPerDay,
      strictLockMode: globalLimit.strictLockMode,
      warningThreshold: globalLimit.warningThreshold,
    },
    platforms: platformLimits,
  }
}

async function logsForRange(userId, start, end) {
  return prisma.consumptionLog.findMany({
    include: { platform: true },
    orderBy: { consumedAt: 'desc' },
    where: {
      consumedAt: { gte: start, lt: end },
      userId,
    },
  })
}

function totalsFromLogs(logs) {
  return logs.reduce((totals, log) => ({
    minutes: totals.minutes + log.minutesConsumed,
    videos: totals.videos + log.videosWatched,
  }), { minutes: 0, videos: 0 })
}

async function refreshDailySummary(userId, date = new Date()) {
  const dayStart = startOfDay(date)
  const dayEnd = addDays(dayStart, 1)
  const [limit, logs] = await Promise.all([
    ensureGlobalLimit(userId),
    logsForRange(userId, dayStart, dayEnd),
  ])
  const totals = totalsFromLogs(logs)
  const score = calculateConsumptionScore(totals.videos, totals.minutes, limit)

  return prisma.consumptionDailySummary.upsert({
    create: {
      date: dayStart,
      limitReached: score.limitReached,
      score: score.score,
      totalMinutes: totals.minutes,
      totalVideos: totals.videos,
      userId,
      warningReached: score.warningReached,
    },
    update: {
      limitReached: score.limitReached,
      score: score.score,
      totalMinutes: totals.minutes,
      totalVideos: totals.videos,
      warningReached: score.warningReached,
    },
    where: {
      userId_date: {
        date: dayStart,
        userId,
      },
    },
  })
}

async function getTodayContext(userId) {
  const today = startOfDay()
  const tomorrow = addDays(today, 1)
  const [limits, logs] = await Promise.all([
    getUserLimits(userId),
    logsForRange(userId, today, tomorrow),
  ])
  const totals = totalsFromLogs(logs)
  const score = calculateConsumptionScore(totals.videos, totals.minutes, limits.global)
  const bySlug = new Map()

  logs.forEach((log) => {
    const current = bySlug.get(log.platform.slug) || { minutes: 0, videos: 0 }
    bySlug.set(log.platform.slug, {
      minutes: current.minutes + log.minutesConsumed,
      videos: current.videos + log.videosWatched,
    })
  })

  return {
    bySlug,
    limits,
    logs,
    score,
    today,
    totals,
  }
}

async function getConsumptionSummary(userId) {
  const context = await getTodayContext(userId)
  await refreshDailySummary(userId, context.today)
  const reels = (context.bySlug.get('instagram-reels')?.videos || 0) + (context.bySlug.get('facebook-reels')?.videos || 0)
  const shorts = (context.bySlug.get('youtube-shorts')?.videos || 0) + (context.bySlug.get('tiktok')?.videos || 0)
  const remaining = Math.max(0, context.limits.global.maxVideosPerDay - context.totals.videos)

  return {
    dailyConsumptionScore: context.score.score,
    dailyLimitRemaining: `${remaining} Videos`,
    limitReached: context.score.limitReached,
    statusText: statusTextForScore(context.score.score),
    strictLockActive: context.limits.global.strictLockMode && context.score.limitReached,
    timeConsumed: formatMinutes(context.totals.minutes),
    todaysReels: reels,
    todaysShorts: shorts,
    totalMinutes: context.totals.minutes,
    totalVideos: context.totals.videos,
    warningReached: context.score.warningReached,
  }
}

async function getPlatformUsage(userId) {
  const context = await getTodayContext(userId)
  const platforms = await getPlatforms()

  return platforms.map((platform) => {
    const usage = context.bySlug.get(platform.slug) || { minutes: 0, videos: 0 }
    const limit = context.limits.platforms.find((item) => item.platformId === platform.id)
    const videoProgress = limit.maxVideosPerDay > 0 ? (usage.videos / limit.maxVideosPerDay) * 100 : 0
    const minuteProgress = limit.maxMinutesPerDay > 0 ? (usage.minutes / limit.maxMinutesPerDay) * 100 : 0
    const progressPercentage = Math.min(100, Math.round(Math.max(videoProgress, minuteProgress)))

    return {
      dailyMinuteLimit: limit.maxMinutesPerDay,
      dailyVideoLimit: limit.maxVideosPerDay,
      domain: platform.domain,
      id: platform.id,
      minutes: usage.minutes,
      minutesConsumed: usage.minutes,
      name: platform.name,
      platformName: platform.name,
      progress: progressPercentage,
      progressPercentage,
      slug: platform.slug,
      status: statusForProgress(progressPercentage),
      videos: usage.videos,
      videosWatched: usage.videos,
    }
  })
}

async function updateLimits(userId, payload) {
  const platforms = await getPlatforms()
  const platformBySlug = new Map(platforms.map((platform) => [platform.slug, platform]))
  const global = payload.global || payload
  const nextGlobal = {
    maxMinutesPerDay: Number(global.maxMinutesPerDay),
    maxVideosPerDay: Number(global.maxVideosPerDay),
    strictLockMode: Boolean(global.strictLockMode),
    warningThreshold: Number(global.warningThreshold),
  }

  await prisma.$transaction(async (tx) => {
    const existingGlobal = await ensureGlobalLimit(userId, tx)
    await tx.consumptionLimit.update({
      data: nextGlobal,
      where: { id: existingGlobal.id },
    })

    for (const limit of payload.platforms || []) {
      const platform = platformBySlug.get(limit.platformSlug)
      if (!platform) continue

      const existing = await tx.consumptionLimit.findFirst({
        where: {
          platformId: platform.id,
          userId,
        },
      })
      const data = {
        active: true,
        maxMinutesPerDay: Number(limit.maxMinutesPerDay),
        maxVideosPerDay: Number(limit.maxVideosPerDay),
        platformId: platform.id,
        strictLockMode: Boolean(limit.strictLockMode ?? nextGlobal.strictLockMode),
        userId,
        warningThreshold: Number(limit.warningThreshold ?? nextGlobal.warningThreshold),
      }

      if (existing) {
        await tx.consumptionLimit.update({ data, where: { id: existing.id } })
      } else {
        await tx.consumptionLimit.create({ data })
      }
    }
  })

  await refreshDailySummary(userId)
  return getUserLimits(userId)
}

async function getLogs(userId) {
  const logs = await prisma.consumptionLog.findMany({
    include: { platform: true },
    orderBy: { consumedAt: 'desc' },
    take: 50,
    where: { userId },
  })

  return logs.map((log) => ({
    consumedAt: log.consumedAt,
    id: log.id,
    minutesConsumed: log.minutesConsumed,
    platformName: log.platform.name,
    platformSlug: log.platform.slug,
    source: log.source,
    videosWatched: log.videosWatched,
  }))
}

async function createLog(userId, payload) {
  const platform = await prisma.consumptionPlatform.findUnique({
    where: { slug: payload.platformSlug },
  })

  if (!platform || !platform.active) {
    throw serviceError('Platform not found', 404)
  }

  const consumedAt = payload.consumedAt ? new Date(payload.consumedAt) : new Date()
  const log = await prisma.consumptionLog.create({
    data: {
      consumedAt,
      metadata: {},
      minutesConsumed: Number(payload.minutesConsumed),
      platformId: platform.id,
      source: 'MANUAL',
      userId,
      videosWatched: Number(payload.videosWatched),
    },
  })

  await refreshDailySummary(userId, consumedAt)
  return log
}

async function deleteLog(userId, id) {
  const log = await prisma.consumptionLog.findFirst({
    where: { id, userId },
  })

  if (!log) {
    throw serviceError('Consumption log not found', 404)
  }

  await prisma.consumptionLog.delete({ where: { id } })
  await refreshDailySummary(userId, log.consumedAt)
}

async function getTimeline(userId) {
  const today = startOfDay()
  const start = addDays(today, -6)
  const end = addDays(today, 1)
  const [limit, logs] = await Promise.all([
    ensureGlobalLimit(userId),
    logsForRange(userId, start, end),
  ])

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index)
    const next = addDays(date, 1)
    const dayLogs = logs.filter((log) => log.consumedAt >= date && log.consumedAt < next)
    const totals = totalsFromLogs(dayLogs)
    const score = calculateConsumptionScore(totals.videos, totals.minutes, limit)

    return {
      date: dateKey(date),
      day: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date),
      score: score.score,
      total: totals.videos,
      totalMinutes: totals.minutes,
      totalVideos: totals.videos,
    }
  })
}

async function getWeeklyAnalytics(userId) {
  const [timeline, platforms, limits] = await Promise.all([
    getTimeline(userId),
    getPlatformUsage(userId),
    getUserLimits(userId),
  ])
  const totalVideos = timeline.reduce((sum, day) => sum + day.totalVideos, 0)
  const totalMinutes = timeline.reduce((sum, day) => sum + day.totalMinutes, 0)
  const average = Math.round(totalVideos / 7)
  const weeklyVideoLimit = limits.global.maxVideosPerDay * 7
  const videosAvoided = Math.max(0, weeklyVideoLimit - totalVideos)
  const estimatedMinutesSaved = videosAvoided * 2
  const best = [...timeline].sort((a, b) => b.score - a.score)[0]
  const worst = [...timeline].sort((a, b) => a.score - b.score)[0]
  const mostUsed = [...platforms].sort((a, b) => b.videosWatched - a.videosWatched)[0]

  return {
    averageDailyConsumption: `${average} videos`,
    bestControlDay: best?.day || 'Today',
    estimatedTimeSaved: formatMinutes(estimatedMinutesSaved),
    focusHoursGained: `${(estimatedMinutesSaved / 60).toFixed(1)}h`,
    mostUsedPlatform: mostUsed?.platformName || 'None',
    totalMinutes,
    totalVideos,
    videosAvoided,
    worstConsumptionDay: worst?.day || 'Today',
  }
}

async function getIdentityConsumptionStats(userId) {
  const timeline = await getTimeline(userId)
  const weekly = await getWeeklyAnalytics(userId)
  const healthyDays = timeline.filter((day) => day.score >= 80).length
  const averageScore = Math.round(timeline.reduce((sum, day) => sum + day.score, 0) / 7)
  const rating = averageScore >= 90 ? 'A' : averageScore >= 80 ? 'A-' : averageScore >= 70 ? 'B' : averageScore >= 50 ? 'C' : 'D'

  return {
    healthyDays,
    rating,
    timeSaved: weekly.estimatedTimeSaved,
    videosAvoided: weekly.videosAvoided,
  }
}

module.exports = {
  createLog,
  deleteLog,
  getConsumptionSummary,
  getIdentityConsumptionStats,
  getLogs,
  getPlatformUsage,
  getTimeline,
  refreshDailySummary,
  getUserLimits,
  getWeeklyAnalytics,
  updateLimits,
}
