function validationError(message, res) {
  return res.status(400).json({ message })
}

function positiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0
}

function nonNegativeNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0
}

function validateLogPayload(req, res, next) {
  const { consumedAt, minutesConsumed, platformSlug, videosWatched } = req.body || {}

  if (!platformSlug || typeof platformSlug !== 'string') {
    return validationError('Platform is required', res)
  }

  if (!nonNegativeNumber(videosWatched)) {
    return validationError('Videos watched must be zero or greater', res)
  }

  if (!nonNegativeNumber(minutesConsumed)) {
    return validationError('Minutes consumed must be zero or greater', res)
  }

  if (consumedAt && Number.isNaN(new Date(consumedAt).getTime())) {
    return validationError('Consumed date must be valid', res)
  }

  req.body.platformSlug = platformSlug.trim().toLowerCase()
  req.body.videosWatched = Number(videosWatched)
  req.body.minutesConsumed = Number(minutesConsumed)
  next()
}

function validateLogId(req, res, next) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return validationError('Log id must be valid', res)
  }

  req.logId = id
  next()
}

function validateSingleLimit(limit, res) {
  if (!positiveNumber(limit.maxVideosPerDay)) {
    return validationError('Daily video limit must be greater than zero', res)
  }

  if (!positiveNumber(limit.maxMinutesPerDay)) {
    return validationError('Daily minute limit must be greater than zero', res)
  }

  const threshold = Number(limit.warningThreshold)
  if (!Number.isFinite(threshold) || threshold < 50 || threshold > 100) {
    return validationError('Warning threshold must be between 50 and 100', res)
  }

  return null
}

function validateLimitsPayload(req, res, next) {
  const body = req.body || {}
  const global = body.global || body
  const globalError = validateSingleLimit(global, res)

  if (globalError) {
    return globalError
  }

  if (body.platforms && !Array.isArray(body.platforms)) {
    return validationError('Platform limits must be an array', res)
  }

  for (const limit of body.platforms || []) {
    if (!limit.platformSlug || typeof limit.platformSlug !== 'string') {
      return validationError('Platform slug is required for platform limits', res)
    }

    const limitError = validateSingleLimit(limit, res)
    if (limitError) {
      return limitError
    }
  }

  next()
}

module.exports = {
  validateLimitsPayload,
  validateLogId,
  validateLogPayload,
}
