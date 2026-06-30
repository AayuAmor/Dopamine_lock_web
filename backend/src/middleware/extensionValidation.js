const { normalizeDomain } = require('../services/extensionService')

function validationError(message, res) {
  return res.status(400).json({ message })
}

function nonNegativeNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0
}

function validDate(value) {
  return !value || !Number.isNaN(new Date(value).getTime())
}

function validateUrl(value) {
  if (!value) return true
  try {
    // Accept plain domains/paths by adding a protocol for parsing.
    const raw = String(value).trim()
    // eslint-disable-next-line no-new
    new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`)
    return true
  } catch {
    return false
  }
}

function validateBlockAttempt(req, res, next) {
  const body = req.body || {}
  const domain = normalizeDomain(body.domain)

  if (!domain) return validationError('Domain is required', res)
  if (body.url && !validateUrl(body.url)) return validationError('URL must be valid', res)
  if (!body.reason || typeof body.reason !== 'string') return validationError('Reason is required', res)
  if (body.timestamp && !validDate(body.timestamp)) return validationError('Timestamp must be valid', res)
  if (body.activeSessionId !== undefined) {
    const activeSessionId = Number(body.activeSessionId)
    if (!Number.isInteger(activeSessionId) || activeSessionId <= 0) {
      return validationError('Active session id must be valid', res)
    }
    body.activeSessionId = activeSessionId
  }

  body.domain = domain
  body.reason = body.reason.trim().slice(0, 500)
  if (body.pageTitle) body.pageTitle = String(body.pageTitle).trim().slice(0, 500)
  req.body = body
  return next()
}

function validateConsumptionEvent(req, res, next) {
  const body = req.body || {}

  if (!body.platformSlug || typeof body.platformSlug !== 'string') {
    return validationError('Platform slug is required', res)
  }
  if (!nonNegativeNumber(body.videosWatched)) {
    return validationError('Videos watched must be zero or greater', res)
  }
  if (!nonNegativeNumber(body.minutesConsumed)) {
    return validationError('Minutes consumed must be zero or greater', res)
  }
  if (body.url && !validateUrl(body.url)) return validationError('URL must be valid', res)
  if (body.timestamp && !validDate(body.timestamp)) return validationError('Timestamp must be valid', res)

  body.platformSlug = body.platformSlug.trim().toLowerCase()
  body.videosWatched = Number(body.videosWatched)
  body.minutesConsumed = Number(body.minutesConsumed)
  req.body = body
  return next()
}

function validateExtensionStatus(req, res, next) {
  const body = req.body || {}

  if (body.browser !== undefined && typeof body.browser !== 'string') {
    return validationError('Browser must be a string', res)
  }
  if (body.extensionVersion !== undefined && typeof body.extensionVersion !== 'string') {
    return validationError('Extension version must be a string', res)
  }
  if (body.installed !== undefined && typeof body.installed !== 'boolean') {
    return validationError('Installed must be boolean', res)
  }
  if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
    return validationError('Enabled must be boolean', res)
  }
  if (body.lastSyncAt && !validDate(body.lastSyncAt)) {
    return validationError('Last sync date must be valid', res)
  }

  if (body.browser) body.browser = body.browser.trim().slice(0, 80)
  if (body.extensionVersion) body.extensionVersion = body.extensionVersion.trim().slice(0, 40)
  req.body = body
  return next()
}

module.exports = {
  validateBlockAttempt,
  validateConsumptionEvent,
  validateExtensionStatus,
}
