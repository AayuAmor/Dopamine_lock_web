const prisma = require('../config/prisma')

const missionOrder = [
  { archived: 'asc' },
  { favorite: 'desc' },
  { createdAt: 'desc' },
]

function formatMission(mission) {
  return {
    id: mission.id,
    userId: mission.userId,
    title: mission.title,
    goal: mission.goal,
    description: mission.description,
    durationMinutes: mission.durationMinutes,
    difficulty: mission.difficulty,
    strictMode: mission.strictMode,
    blockNotifications: mission.blockNotifications,
    preventTabSwitching: mission.preventTabSwitching,
    blockedWebsites: mission.blockedWebsites || [],
    allowedWebsites: mission.allowedWebsites || [],
    blockedCategories: mission.blockedCategories || [],
    status: mission.status,
    favorite: mission.favorite,
    archived: mission.archived,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
  }
}

async function getMissionsByUserId(userId) {
  const missions = await prisma.mission.findMany({
    where: { userId },
    orderBy: missionOrder,
  })

  return missions.map(formatMission)
}

async function getMissionById(userId, missionId) {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      userId,
    },
  })

  return mission ? formatMission(mission) : null
}

async function createMission(userId, data) {
  const mission = await prisma.mission.create({
    data: {
      ...data,
      userId,
    },
  })

  return formatMission(mission)
}

async function updateMission(userId, missionId, data) {
  const existing = await getMissionById(userId, missionId)

  if (!existing) {
    return null
  }

  const mission = await prisma.mission.update({
    where: { id: missionId },
    data,
  })

  return formatMission(mission)
}

async function archiveMission(userId, missionId, archived = true) {
  return updateMission(userId, missionId, {
    archived,
    status: archived ? 'Archived' : 'Ready',
  })
}

async function softDeleteMission(userId, missionId) {
  return archiveMission(userId, missionId, true)
}

async function toggleFavoriteMission(userId, missionId, favorite) {
  const existing = await getMissionById(userId, missionId)

  if (!existing) {
    return null
  }

  const mission = await prisma.mission.update({
    where: { id: missionId },
    data: {
      favorite: favorite === undefined ? !existing.favorite : Boolean(favorite),
    },
  })

  return formatMission(mission)
}

module.exports = {
  archiveMission,
  createMission,
  getMissionById,
  getMissionsByUserId,
  softDeleteMission,
  toggleFavoriteMission,
  updateMission,
}
