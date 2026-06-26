const prisma = require('../config/prisma')

const terminalStatuses = ['COMPLETED', 'ABANDONED']
const validSorts = new Set(['Newest', 'Oldest', 'Duration', 'Completion Time', 'Mission Name'])

function startOfDay(date = new Date()) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date = new Date()) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function startOfWeek(date = new Date()) {
  const value = startOfDay(date)
  const day = value.getDay()
  const diff = day === 0 ? 6 : day - 1
  value.setDate(value.getDate() - diff)
  return value
}

function startOfMonth(date = new Date()) {
  const value = new Date(date)
  value.setDate(1)
  value.setHours(0, 0, 0, 0)
  return value
}

function formatSession(session) {
  return {
    id: session.id,
    userId: session.userId,
    missionId: session.missionId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    completedAt: session.completedAt,
    elapsedSeconds: session.elapsedSeconds,
    remainingSeconds: session.remainingSeconds,
    completionPercentage: session.completionPercentage,
    actualDurationMinutes: session.actualDurationMinutes,
    plannedDurationMinutes: session.plannedDurationMinutes,
    focusPercentage: session.focusPercentage,
    interruptionCount: session.interruptionCount,
    blockedWebsitesCount: session.blockedWebsitesCount,
    completionReason: session.completionReason,
    status: session.status,
    completed: session.completed,
    abandoned: session.abandoned,
    notes: session.notes,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    mission: session.mission ? {
      id: session.mission.id,
      title: session.mission.title,
      goal: session.mission.goal,
      description: session.mission.description,
      durationMinutes: session.mission.durationMinutes,
      difficulty: session.mission.difficulty,
      favorite: session.mission.favorite,
      blockedWebsites: session.mission.blockedWebsites || [],
      allowedWebsites: session.mission.allowedWebsites || [],
      blockedCategories: session.mission.blockedCategories || [],
    } : null,
  }
}

function buildWhere(userId, query = {}, windowRange) {
  const where = {
    userId,
    endedAt: { not: null },
    status: { in: terminalStatuses },
  }

  if (windowRange) {
    where.endedAt = {
      gte: windowRange.from,
      lte: windowRange.to || new Date(),
    }
  }

  if (query.status && query.status !== 'All') {
    const status = String(query.status).toUpperCase()
    if (terminalStatuses.includes(status)) {
      where.status = status
    }
  }

  if (query.date) {
    const date = new Date(query.date)
    if (!Number.isNaN(date.getTime())) {
      where.endedAt = {
        gte: startOfDay(date),
        lte: endOfDay(date),
      }
    }
  }

  if (query.difficulty) {
    where.mission = {
      ...(where.mission || {}),
      difficulty: query.difficulty,
    }
  }

  if (query.favorite !== undefined) {
    where.mission = {
      ...(where.mission || {}),
      favorite: query.favorite === 'true' || query.favorite === true,
    }
  }

  if (query.mission) {
    where.mission = {
      ...(where.mission || {}),
      title: {
        contains: String(query.mission),
        mode: 'insensitive',
      },
    }
  }

  if (query.search) {
    const search = String(query.search).trim()
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { mission: { title: { contains: search, mode: 'insensitive' } } },
        { mission: { goal: { contains: search, mode: 'insensitive' } } },
      ]
    }
  }

  return where
}

function buildOrderBy(sort) {
  if (sort === 'Oldest') {
    return [{ endedAt: 'asc' }]
  }

  if (sort === 'Duration') {
    return [{ elapsedSeconds: 'desc' }]
  }

  if (sort === 'Completion Time') {
    return [{ completionPercentage: 'desc' }]
  }

  if (sort === 'Mission Name') {
    return [{ mission: { title: 'asc' } }]
  }

  return [{ endedAt: 'desc' }]
}

function paginationFromQuery(query) {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10))
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit || '10', 10)))
  return { limit, page }
}

async function getHistory(userId, query = {}, windowRange) {
  const { limit, page } = paginationFromQuery(query)
  const sort = validSorts.has(query.sort) ? query.sort : 'Newest'
  const where = buildWhere(userId, query, windowRange)
  const [items, totalItems] = await Promise.all([
    prisma.missionSession.findMany({
      where,
      include: { mission: true },
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.missionSession.count({ where }),
  ])

  return {
    items: items.map(formatSession),
    limit,
    page,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
  }
}

async function getSession(userId, sessionId) {
  const session = await prisma.missionSession.findFirst({
    where: {
      id: sessionId,
      userId,
      endedAt: { not: null },
      status: { in: terminalStatuses },
    },
    include: { mission: true },
  })

  return session ? formatSession(session) : null
}

async function getSummary(userId) {
  const sessions = await prisma.missionSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      status: { in: terminalStatuses },
    },
    select: {
      elapsedSeconds: true,
      status: true,
    },
  })
  const totalSessions = sessions.length
  const completedSessions = sessions.filter((session) => session.status === 'COMPLETED').length
  const abandonedSessions = sessions.filter((session) => session.status === 'ABANDONED').length
  const totalSeconds = sessions.reduce((sum, session) => sum + session.elapsedSeconds, 0)
  const longestSeconds = sessions.reduce((max, session) => Math.max(max, session.elapsedSeconds), 0)
  const weekSessions = await prisma.missionSession.count({
    where: buildWhere(userId, {}, { from: startOfWeek(), to: new Date() }),
  })

  return {
    abandonedSessions,
    averageSessionDuration: totalSessions ? Math.round(totalSeconds / totalSessions) : 0,
    completedSessions,
    currentWeekSessions: weekSessions,
    longestSession: longestSeconds,
    successRate: totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0,
    totalFocusHours: Number((totalSeconds / 3600).toFixed(1)),
    totalSessions,
  }
}

async function getToday(userId, query = {}) {
  return getHistory(userId, query, { from: startOfDay(), to: endOfDay() })
}

async function getWeek(userId, query = {}) {
  return getHistory(userId, query, { from: startOfWeek(), to: new Date() })
}

async function getMonth(userId, query = {}) {
  return getHistory(userId, query, { from: startOfMonth(), to: new Date() })
}

module.exports = {
  getHistory,
  getMonth,
  getSession,
  getSummary,
  getToday,
  getWeek,
}
