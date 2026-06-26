const fs = require('fs/promises')
const path = require('path')
const {
  getProfileByUserId,
  updateProfileByUserId,
} = require('../services/profileService')
const { avatarUploadDir } = require('../middleware/avatarUpload')

const MAX_BIO_LENGTH = 500

function cleanString(value) {
  if (value === undefined || value === null) {
    return undefined
  }

  return String(value).trim()
}

function positiveNumber(value, fieldLabel) {
  if (value === undefined) {
    return { value: undefined }
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return { error: `${fieldLabel} must be a positive number` }
  }

  return { value: Math.round(numberValue) }
}

function buildProfileUpdate(body) {
  const data = {}
  const fullName = cleanString(body.fullName)
  const bio = cleanString(body.bio)
  const timezone = cleanString(body.timezone)
  const dailyFocusGoal = positiveNumber(body.dailyFocusGoal, 'Daily focus goal')
  const preferredMissionDuration = positiveNumber(
    body.preferredMissionDuration,
    'Preferred mission duration',
  )

  if (fullName !== undefined) {
    if (!fullName) {
      return { error: 'Full name is required' }
    }
    data.fullName = fullName
  }

  if (bio !== undefined) {
    if (bio.length > MAX_BIO_LENGTH) {
      return { error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` }
    }
    data.bio = bio || null
  }

  if (timezone !== undefined) {
    if (!timezone) {
      return { error: 'Timezone is required' }
    }
    data.timezone = timezone
  }

  if (dailyFocusGoal.error) {
    return { error: dailyFocusGoal.error }
  }

  if (dailyFocusGoal.value !== undefined) {
    data.dailyFocusGoal = dailyFocusGoal.value
  }

  if (preferredMissionDuration.error) {
    return { error: preferredMissionDuration.error }
  }

  if (preferredMissionDuration.value !== undefined) {
    data.preferredMissionDuration = preferredMissionDuration.value
  }

  return { data }
}

async function getProfile(req, res) {
  const profile = await getProfileByUserId(req.user.id)

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' })
  }

  return res.json({ profile })
}

async function updateProfile(req, res) {
  try {
    const { data, error } = buildProfileUpdate(req.body)

    if (error) {
      return res.status(400).json({ message: error })
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No editable profile fields provided' })
    }

    const profile = await updateProfileByUserId(req.user.id, data)
    return res.json({ profile })
  } catch (error) {
    console.error('Profile update error:', error)
    return res.status(500).json({ message: 'Unable to update profile' })
  }
}

async function updateAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar image is required' })
    }

    const oldAvatarUrl = req.user.avatarUrl
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    const profile = await updateProfileByUserId(req.user.id, { avatarUrl })

    await deleteOldLocalAvatar(oldAvatarUrl, avatarUrl)

    return res.json({ profile })
  } catch (error) {
    console.error('Avatar update error:', error)

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {})
    }

    return res.status(500).json({ message: 'Unable to update avatar' })
  }
}

async function deleteOldLocalAvatar(oldAvatarUrl, newAvatarUrl) {
  if (!oldAvatarUrl || oldAvatarUrl === newAvatarUrl || !oldAvatarUrl.startsWith('/uploads/avatars/')) {
    return
  }

  const filename = path.basename(oldAvatarUrl)
  const filePath = path.join(avatarUploadDir, filename)
  const resolvedUploadDir = path.resolve(avatarUploadDir)
  const resolvedFilePath = path.resolve(filePath)

  if (!resolvedFilePath.startsWith(`${resolvedUploadDir}${path.sep}`)) {
    return
  }

  await fs.unlink(resolvedFilePath).catch(() => {})
}

module.exports = {
  getProfile,
  updateAvatar,
  updateProfile,
}
