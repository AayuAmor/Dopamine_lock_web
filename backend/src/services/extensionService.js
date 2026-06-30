const prisma = require('../config/prisma')
const { getEffectiveRules: getBlockManagerEffectiveRules } = require('./blockManagerService')
const { getConsumptionSummary, getPlatformUsage, getUserLimits, refreshDailySummary } = require('./consumptionService')
const { getCurrentSession } = require('./missionSessionService')

const SYNC_HEALTH_WINDOW_MS = 5 * 60 * 1000

function normalizeDomain(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .replace(/\.$/, '')
}

function normalizeUrl(value, domain) {
  const raw = String(value || '').trim()
  if (!raw) return domain ? `https://${domain}` : ''

  try {
    const url = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`)
    return url.toString()
  } catch {
    return domain ? `https://${domain}` : raw.slice(0, 2048)
  }
}

function uniqueStrings(values) {
  return [...new Set((values || []).map(normalizeDomain).filter(Boolean))]
}

function safeDate(value, fallback = new Date()) {
  const parsed = value ? new Date(value) : fallback
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function formatStatus(status) {
  if (!status) {
    return {
      browser: null,
      enabled: false,
      extensionVersion: null,
      installed: false,
      lastSyncAt: null,
      syncHealthy: false,
    }
  }

  const syncHealthy = Boolean(
    status.enabled &&
    status.lastSyncAt &&
    Date.now() - new Date(status.lastSyncAt).getTime() <= SYNC_HEALTH_WINDOW_MS,
  )

  return {
    browser: status.browser,
    enabled: status.enabled,
    extensionVersion: status.extensionVersion,
    installed: status.installed,
    lastSyncAt: status.lastSyncAt,
    syncHealthy,
  }
}

async function getExtensionStatus(userId) {
  const status = await prisma.extensionStatus.findUnique({ where: { userId } })
  return formatStatus(status)
}

async function updateExtensionStatus(userId, payload) {
  const now = new Date()
  const lastSyncAt = payload.lastSyncAt ? safeDate(payload.lastSyncAt, now) : now
  const status = await prisma.extensionStatus.upsert({
    create: {
      browser: payload.browser || null,
      enabled: Boolean(payload.enabled),
      extensionVersion: payload.extensionVersion || null,
      installed: Boolean(payload.installed),
      lastSyncAt,
      userId,
    },
    update: {
      browser: payload.browser || null,
      enabled: Boolean(payload.enabled),
      extensionVersion: payload.extensionVersion || null,
      installed: Boolean(payload.installed),
      lastSyncAt,
    },
    where: { userId },
  })

  return formatStatus(status)
}

function formatMissionState(session) {
  if (!session) {
    return {
      activeSessionId: null,
      allowedWebsites: [],
      blockedWebsites: [],
      blockNotifications: false,
      completionPercentage: 0,
      hasActiveMission: false,
      missionGoal: null,
      missionId: null,
      missionTitle: null,
      preventTabSwitching: false,
      remainingSeconds: 0,
      startedAt: null,
      status: 'NONE',
      strictMode: false,
    }
  }

  return {
    activeSessionId: session.id,
    allowedWebsites: uniqueStrings(session.mission?.allowedWebsites || []),
    blockedWebsites: uniqueStrings(session.mission?.blockedWebsites || []),
    blockNotifications: Boolean(session.mission?.blockNotifications),
    completionPercentage: session.completionPercentage || 0,
    hasActiveMission: true,
    missionGoal: session.mission?.goal || null,
    missionId: session.missionId,
    missionTitle: session.mission?.title || 'Mission',
    preventTabSwitching: Boolean(session.mission?.preventTabSwitching),
    remainingSeconds: session.remainingSeconds || 0,
    startedAt: session.startedAt,
    status: session.status,
    strictMode: Boolean(session.mission?.strictMode),
  }
}

async function getMissionState(userId) {
  return formatMissionState(await getCurrentSession(userId))
}

async function getEffectiveRules(userId) {
  const [rules, session] = await Promise.all([
    getBlockManagerEffectiveRules(userId),
    getCurrentSession(userId),
  ])
  const missionState = formatMissionState(session)
  const customBlocked = rules.customBlocked || []
  const customAllowed = rules.customAllowed || []
  const presetBlocked = rules.presetBlocked || []
  const missionBlocked = rules.missionBlocked || []
  const missionAllowed = rules.missionAllowed || []

  return {
    activePresets: rules.presets || [],
    allowedWebsites: uniqueStrings([
      ...(rules.allowedDomains || []),
      ...missionAllowed.map((rule) => rule.domain),
    ]),
    blockedCategories: uniqueStrings([
      ...(session?.mission?.blockedCategories || []),
      ...customBlocked.map((rule) => rule.category),
      ...presetBlocked.map((rule) => rule.category),
    ]),
    blockedWebsites: uniqueStrings([
      ...(rules.blockedDomains || []),
      ...missionBlocked.map((rule) => rule.domain),
    ]),
    globalBlockRules: {
      allowed: customAllowed,
      blocked: customBlocked,
      presets: presetBlocked,
    },
    missionSpecificRules: {
      allowed: missionAllowed,
      blocked: missionBlocked,
      blockedCategories: session?.mission?.blockedCategories || [],
      missionId: session?.missionId || null,
    },
    strictMode: missionState.strictMode,
  }
}

async function getConsumptionState(userId) {
  const [platforms, limits, summary] = await Promise.all([
    getPlatformUsage(userId),
    getUserLimits(userId),
    getConsumptionSummary(userId),
  ])

  return {
    limitReached: Boolean(summary.limitReached),
    limits,
    platforms,
    strictLockActive: Boolean(summary.strictLockActive),
    strictLockMode: Boolean(limits.global?.strictLockMode),
    todayUsage: {
      reels: summary.todaysReels || 0,
      shorts: summary.todaysShorts || 0,
      timeConsumed: summary.timeConsumed || '0m',
      totalMinutes: summary.totalMinutes || 0,
      totalVideos: summary.totalVideos || 0,
    },
    warningReached: Boolean(summary.warningReached),
  }
}

async function getSyncState(userId) {
  const [user, missionState, effectiveRules, consumptionState, extensionStatus] = await Promise.all([
    prisma.user.findUnique({
      select: { avatarUrl: true, email: true, fullName: true, id: true },
      where: { id: userId },
    }),
    getMissionState(userId),
    getEffectiveRules(userId),
    getConsumptionState(userId),
    getExtensionStatus(userId),
  ])

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return {
    activeMission: missionState,
    allowedWebsites: effectiveRules.allowedWebsites,
    blockNotifications: missionState.blockNotifications,
    consumptionLimits: consumptionState.limits,
    consumptionStatus: {
      limitReached: consumptionState.limitReached,
      strictLockActive: consumptionState.strictLockActive,
      todayUsage: consumptionState.todayUsage,
      warningReached: consumptionState.warningReached,
    },
    effectiveBlockedWebsites: effectiveRules.blockedWebsites,
    extensionStatus,
    preventTabSwitching: missionState.preventTabSwitching,
    serverTime: new Date(),
    strictMode: missionState.strictMode || consumptionState.strictLockActive,
    user,
  }
}

async function assertSessionOwnership(userId, activeSessionId) {
  if (!activeSessionId) return null
  const session = await prisma.missionSession.findFirst({
    where: { id: Number(activeSessionId), userId },
  })
  if (!session) {
    const error = new Error('Active session not found for this user')
    error.statusCode = 404
    throw error
  }
  return session
}

async function recordBlockAttempt(userId, payload) {
  const domain = normalizeDomain(payload.domain)
  const attemptedAt = safeDate(payload.timestamp)
  const session = await assertSessionOwnership(userId, payload.activeSessionId)
  const url = normalizeUrl(payload.url, domain)

  const attempt = await prisma.blockedAttempt.create({
    data: {
      attemptedAt,
      domain,
      missionSessionId: session?.id || null,
      pageTitle: payload.pageTitle || null,
      reason: payload.reason,
      source: 'EXTENSION',
      url,
      userId,
    },
  })

  if (session) {
    await prisma.missionSession.update({
      data: { blockedWebsitesCount: { increment: 1 } },
      where: { id: session.id },
    })
  }

  return attempt
}

async function recordConsumptionEvent(userId, payload) {
  const platform = await prisma.consumptionPlatform.findUnique({
    where: { slug: payload.platformSlug },
  })

  if (!platform || !platform.active) {
    const error = new Error('Consumption platform not found')
    error.statusCode = 404
    throw error
  }

  const consumedAt = safeDate(payload.timestamp)
  const log = await prisma.consumptionLog.create({
    data: {
      consumedAt,
      metadata: {
        source: 'EXTENSION',
        url: payload.url || null,
      },
      minutesConsumed: Number(payload.minutesConsumed),
      platformId: platform.id,
      source: 'EXTENSION',
      userId,
      videosWatched: Number(payload.videosWatched),
    },
    include: { platform: true },
  })

  await refreshDailySummary(userId, consumedAt)
  return {
    consumedAt: log.consumedAt,
    id: log.id,
    minutesConsumed: log.minutesConsumed,
    platformName: log.platform.name,
    platformSlug: log.platform.slug,
    source: log.source,
    videosWatched: log.videosWatched,
  }
}

module.exports = {
  getConsumptionState,
  getEffectiveRules,
  getExtensionStatus,
  getMissionState,
  getSyncState,
  normalizeDomain,
  recordBlockAttempt,
  recordConsumptionEvent,
  updateExtensionStatus,
}
