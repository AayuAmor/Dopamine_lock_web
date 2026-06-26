const prisma = require('../config/prisma')
const { recordMissionSessionScore } = require('./disciplineScoreService')

const activeStatuses = ['ACTIVE', 'PAUSED']

function serviceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function secondsBetween(start, end) {
  return Math.max(0, Math.floor((end.getTime() - new Date(start).getTime()) / 1000))
}

function getDurationSeconds(session) {
  return (session.mission?.durationMinutes || 0) * 60
}

function calculateSessionTiming(session, now = new Date()) {
  const durationSeconds = getDurationSeconds(session)
  const elapsedSeconds = session.status === 'ACTIVE'
    ? Math.max(0, secondsBetween(session.startedAt, now) - session.totalPausedSeconds)
    : session.elapsedSeconds
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)
  const completionPercentage = durationSeconds > 0
    ? Math.min(100, Math.round((elapsedSeconds / durationSeconds) * 100))
    : 0

  return {
    completionPercentage,
    elapsedSeconds,
    estimatedFinishAt: session.status === 'ACTIVE'
      ? new Date(now.getTime() + remainingSeconds * 1000)
      : null,
    remainingSeconds,
  }
}

function formatSession(session, now = new Date()) {
  if (!session) {
    return null
  }

  const timing = calculateSessionTiming(session, now)

  return {
    id: session.id,
    userId: session.userId,
    missionId: session.missionId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    completedAt: session.completedAt,
    pausedAt: session.pausedAt,
    totalPausedSeconds: session.totalPausedSeconds,
    elapsedSeconds: timing.elapsedSeconds,
    remainingSeconds: timing.remainingSeconds,
    completionPercentage: timing.completionPercentage,
    actualDurationMinutes: session.actualDurationMinutes,
    plannedDurationMinutes: session.plannedDurationMinutes,
    focusPercentage: session.focusPercentage,
    interruptionCount: session.interruptionCount,
    blockedWebsitesCount: session.blockedWebsitesCount,
    completionReason: session.completionReason,
    estimatedFinishAt: timing.estimatedFinishAt,
    serverNow: now,
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
      strictMode: session.mission.strictMode,
      blockNotifications: session.mission.blockNotifications,
      preventTabSwitching: session.mission.preventTabSwitching,
      blockedWebsites: session.mission.blockedWebsites || [],
      allowedWebsites: session.mission.allowedWebsites || [],
      blockedCategories: session.mission.blockedCategories || [],
      status: session.mission.status,
      favorite: session.mission.favorite,
      archived: session.mission.archived,
    } : null,
  }
}

async function findCurrentSession(userId) {
  return prisma.missionSession.findFirst({
    where: {
      userId,
      endedAt: null,
      status: { in: activeStatuses },
    },
    include: { mission: true },
    orderBy: { startedAt: 'desc' },
  })
}

async function getCurrentSession(userId) {
  return formatSession(await findCurrentSession(userId))
}

async function getSessionHistory(userId) {
  const sessions = await prisma.missionSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
    },
    include: { mission: true },
    orderBy: { startedAt: 'desc' },
  })

  return sessions.map((session) => formatSession(session))
}

async function startMissionSession(userId, missionId) {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      userId,
    },
  })

  if (!mission) {
    throw serviceError('Mission not found', 404)
  }

  if (mission.archived || mission.status === 'Archived') {
    throw serviceError('Archived missions cannot be started')
  }

  const current = await findCurrentSession(userId)

  if (current) {
    throw serviceError('Finish your current mission before starting another', 409)
  }

  const remainingSeconds = mission.durationMinutes * 60

  try {
    const session = await prisma.$transaction(async (tx) => {
      const createdSession = await tx.missionSession.create({
        data: {
          userId,
          missionId,
          remainingSeconds,
        },
        include: { mission: true },
      })

      await tx.mission.update({
        where: { id: missionId },
        data: {
          lastStartedAt: createdSession.startedAt,
          sessionCount: { increment: 1 },
        },
      })

      return createdSession
    })

    return formatSession(session)
  } catch (error) {
    if (error.code === 'P2002') {
      throw serviceError('Finish your current mission before starting another', 409)
    }

    throw error
  }
}

async function pauseCurrentSession(userId) {
  const session = await findCurrentSession(userId)

  if (!session) {
    throw serviceError('No active mission session found', 404)
  }

  if (session.status !== 'ACTIVE') {
    throw serviceError('Only active mission sessions can be paused')
  }

  const now = new Date()
  const timing = calculateSessionTiming(session, now)
  const updatedSession = await prisma.missionSession.update({
    where: { id: session.id },
    data: {
      completionPercentage: timing.completionPercentage,
      elapsedSeconds: timing.elapsedSeconds,
      pausedAt: now,
      remainingSeconds: timing.remainingSeconds,
      status: 'PAUSED',
    },
    include: { mission: true },
  })

  await recordMissionSessionScore(updatedSession)

  return formatSession(updatedSession, now)
}

async function resumeCurrentSession(userId) {
  const session = await findCurrentSession(userId)

  if (!session) {
    throw serviceError('No paused mission session found', 404)
  }

  if (session.status === 'ACTIVE') {
    throw serviceError('Mission session is already active')
  }

  if (session.status !== 'PAUSED') {
    throw serviceError('Only paused mission sessions can be resumed')
  }

  const now = new Date()
  const pauseSeconds = session.pausedAt ? secondsBetween(session.pausedAt, now) : 0
  const updatedSession = await prisma.missionSession.update({
    where: { id: session.id },
    data: {
      pausedAt: null,
      status: 'ACTIVE',
      totalPausedSeconds: { increment: pauseSeconds },
    },
    include: { mission: true },
  })

  await recordMissionSessionScore(updatedSession)

  return formatSession(updatedSession, now)
}

async function completeCurrentSession(userId, notes) {
  const session = await findCurrentSession(userId)

  if (!session) {
    throw serviceError('No active mission session found', 404)
  }

  if (session.status === 'PAUSED') {
    throw serviceError('Resume the mission before completing it')
  }

  if (session.status !== 'ACTIVE') {
    throw serviceError('Only active mission sessions can be completed')
  }

  const now = new Date()
  const timing = calculateSessionTiming(session, now)
  const plannedDurationMinutes = session.mission.durationMinutes
  const actualDurationMinutes = Math.max(1, Math.round(timing.elapsedSeconds / 60))
  const updatedSession = await prisma.$transaction(async (tx) => {
    const completedSession = await tx.missionSession.update({
      where: { id: session.id },
      data: {
        actualDurationMinutes,
        blockedWebsitesCount: (session.mission.blockedWebsites || []).length,
        completedAt: now,
        completed: true,
        completionReason: 'Completed by user',
        completionPercentage: 100,
        elapsedSeconds: timing.elapsedSeconds,
        endedAt: now,
        focusPercentage: 100,
        notes: notes || session.notes,
        plannedDurationMinutes,
        remainingSeconds: 0,
        status: 'COMPLETED',
      },
      include: { mission: true },
    })

    await tx.mission.update({
      where: { id: session.missionId },
      data: {
        completedSessionCount: { increment: 1 },
        lastCompletedAt: now,
      },
    })

    return completedSession
  })

  return formatSession(updatedSession, now)
}

async function abandonCurrentSession(userId, notes) {
  const session = await findCurrentSession(userId)

  if (!session) {
    throw serviceError('No active mission session found', 404)
  }

  const now = new Date()
  const timing = calculateSessionTiming(session, now)
  const plannedDurationMinutes = session.mission.durationMinutes
  const actualDurationMinutes = Math.max(1, Math.round(timing.elapsedSeconds / 60))
  const updatedSession = await prisma.$transaction(async (tx) => {
    const abandonedSession = await tx.missionSession.update({
      where: { id: session.id },
      data: {
        abandoned: true,
        actualDurationMinutes,
        blockedWebsitesCount: (session.mission.blockedWebsites || []).length,
        completionReason: 'Abandoned by user',
        completionPercentage: timing.completionPercentage,
        elapsedSeconds: timing.elapsedSeconds,
        endedAt: now,
        focusPercentage: timing.completionPercentage,
        notes: notes || session.notes,
        pausedAt: null,
        plannedDurationMinutes,
        remainingSeconds: timing.remainingSeconds,
        status: 'ABANDONED',
      },
      include: { mission: true },
    })

    await tx.mission.update({
      where: { id: session.missionId },
      data: {
        abandonedSessionCount: { increment: 1 },
      },
    })

    return abandonedSession
  })

  return formatSession(updatedSession, now)
}

module.exports = {
  abandonCurrentSession,
  completeCurrentSession,
  getCurrentSession,
  getSessionHistory,
  pauseCurrentSession,
  resumeCurrentSession,
  startMissionSession,
}
