const allowedDifficulties = new Set(['Easy', 'Medium', 'Hard'])
const allowedStatuses = new Set(['Draft', 'Ready', 'Archived'])

function cleanString(value) {
  if (value === undefined || value === null) {
    return undefined
  }

  return String(value).trim()
}

function cleanBoolean(value) {
  if (value === undefined) {
    return undefined
  }

  if (value === 'false') {
    return false
  }

  if (value === 'true') {
    return true
  }

  return Boolean(value)
}

function cleanArray(value, fieldLabel) {
  if (value === undefined) {
    return { value: undefined }
  }

  if (!Array.isArray(value)) {
    return { error: `${fieldLabel} must be an array` }
  }

  return {
    value: value
      .map((item) => String(item || '').trim())
      .filter(Boolean),
  }
}

function cleanDuration(value) {
  if (value === undefined) {
    return { value: undefined }
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return { error: 'Duration must be a positive number' }
  }

  return { value: Math.round(numberValue) }
}

function buildMissionData(body, requireAll = false) {
  const data = {}
  const title = cleanString(body.title || body.name)
  const goal = cleanString(body.goal)
  const description = cleanString(body.description)
  const durationMinutes = cleanDuration(body.durationMinutes ?? body.duration)
  const difficulty = cleanString(body.difficulty)
  const status = cleanString(body.status)
  const blockedWebsites = cleanArray(body.blockedWebsites, 'Blocked websites')
  const allowedWebsites = cleanArray(body.allowedWebsites, 'Allowed websites')
  const blockedCategories = cleanArray(body.blockedCategories, 'Blocked categories')

  if (requireAll && !title) {
    return { error: 'Mission title is required' }
  }

  if (title !== undefined) {
    if (!title) {
      return { error: 'Mission title is required' }
    }
    data.title = title
  }

  if (requireAll && !goal) {
    return { error: 'Goal is required' }
  }

  if (goal !== undefined) {
    if (!goal) {
      return { error: 'Goal is required' }
    }
    data.goal = goal
  }

  if (description !== undefined) {
    data.description = description || null
  }

  if (requireAll && durationMinutes.value === undefined) {
    return { error: 'Duration is required' }
  }

  if (durationMinutes.error) {
    return { error: durationMinutes.error }
  }

  if (durationMinutes.value !== undefined) {
    data.durationMinutes = durationMinutes.value
  }

  if (requireAll && !difficulty) {
    return { error: 'Difficulty is required' }
  }

  if (difficulty !== undefined) {
    if (!allowedDifficulties.has(difficulty)) {
      return { error: 'Difficulty must be Easy, Medium, or Hard' }
    }
    data.difficulty = difficulty
  }

  if (status !== undefined) {
    if (!allowedStatuses.has(status)) {
      return { error: 'Status must be Draft, Ready, or Archived' }
    }
    data.status = status
    data.archived = status === 'Archived'
  }

  const strictMode = cleanBoolean(body.strictMode)
  const blockNotifications = cleanBoolean(body.blockNotifications)
  const preventTabSwitching = cleanBoolean(body.preventTabSwitching)

  if (strictMode !== undefined) {
    data.strictMode = strictMode
  }

  if (blockNotifications !== undefined) {
    data.blockNotifications = blockNotifications
  }

  if (preventTabSwitching !== undefined) {
    data.preventTabSwitching = preventTabSwitching
  }

  if (blockedWebsites.error) {
    return { error: blockedWebsites.error }
  }

  if (blockedWebsites.value !== undefined) {
    data.blockedWebsites = blockedWebsites.value
  }

  if (allowedWebsites.error) {
    return { error: allowedWebsites.error }
  }

  if (allowedWebsites.value !== undefined) {
    data.allowedWebsites = allowedWebsites.value
  }

  if (blockedCategories.error) {
    return { error: blockedCategories.error }
  }

  if (blockedCategories.value !== undefined) {
    data.blockedCategories = blockedCategories.value
  }

  return { data }
}

function validateCreateMission(req, res, next) {
  const { data, error } = buildMissionData(req.body, true)

  if (error) {
    return res.status(400).json({ message: error })
  }

  req.missionData = data
  return next()
}

function validateUpdateMission(req, res, next) {
  const { data, error } = buildMissionData(req.body)

  if (error) {
    return res.status(400).json({ message: error })
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'No editable mission fields provided' })
  }

  req.missionData = data
  return next()
}

module.exports = {
  allowedDifficulties,
  allowedStatuses,
  validateCreateMission,
  validateUpdateMission,
}
