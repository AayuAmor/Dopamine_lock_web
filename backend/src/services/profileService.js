const prisma = require('../config/prisma')

const profileSelect = {
  id: true,
  fullName: true,
  email: true,
  avatarUrl: true,
  bio: true,
  timezone: true,
  dailyFocusGoal: true,
  preferredMissionDuration: true,
  disciplineTitle: true,
  createdAt: true,
  updatedAt: true,
}

function formatProfile(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    timezone: user.timezone,
    dailyFocusGoal: user.dailyFocusGoal,
    preferredMissionDuration: user.preferredMissionDuration,
    disciplineTitle: user.disciplineTitle,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

async function getProfileByUserId(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  })

  return user ? formatProfile(user) : null
}

async function updateProfileByUserId(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect,
  })

  return formatProfile(user)
}

module.exports = {
  formatProfile,
  getProfileByUserId,
  profileSelect,
  updateProfileByUserId,
}
