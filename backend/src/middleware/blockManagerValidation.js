const allowedTypes = new Set(['BLOCKED', 'ALLOWED'])
const allowedCategories = new Set([
  'SOCIAL_MEDIA',
  'ENTERTAINMENT',
  'GAMING',
  'SHOPPING',
  'NEWS',
  'ADULT',
  'CUSTOM',
  'PRODUCTIVITY',
  'EDUCATION',
])
const allowedSources = new Set(['CUSTOM', 'PRESET', 'MISSION'])
const domainPattern = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/

function normalizeDomain(value) {
  const rawValue = String(value || '').trim().toLowerCase()

  if (!rawValue) {
    return ''
  }

  let domain = rawValue
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .replace(/\/+$/, '')

  if (domain.includes(':')) {
    domain = domain.split(':')[0]
  }

  return domain
}

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

function buildBlockRuleData(body, requireAll = false) {
  const data = {}
  const domain = body.domain === undefined ? undefined : normalizeDomain(body.domain)
  const type = cleanString(body.type)?.toUpperCase()
  const category = cleanString(body.category)?.toUpperCase()
  const source = cleanString(body.source)?.toUpperCase()
  const reason = cleanString(body.reason)
  const active = cleanBoolean(body.active)

  if (requireAll && !domain) {
    return { error: 'Domain is required' }
  }

  if (domain !== undefined) {
    if (!domain) {
      return { error: 'Domain is required' }
    }

    if (!domainPattern.test(domain)) {
      return { error: 'Enter a valid domain' }
    }

    data.domain = domain
  }

  if (requireAll && !type) {
    return { error: 'Type is required' }
  }

  if (type !== undefined) {
    if (!allowedTypes.has(type)) {
      return { error: 'Type must be BLOCKED or ALLOWED' }
    }
    data.type = type
  }

  if (category !== undefined) {
    if (!allowedCategories.has(category)) {
      return { error: 'Category is invalid' }
    }
    data.category = category
  } else if (requireAll) {
    data.category = 'CUSTOM'
  }

  if (source !== undefined) {
    if (!allowedSources.has(source)) {
      return { error: 'Source is invalid' }
    }
    data.source = source
  } else if (requireAll) {
    data.source = 'CUSTOM'
  }

  if (reason !== undefined) {
    data.reason = reason || null
  }

  if (active !== undefined) {
    data.active = active
  }

  return { data }
}

function parseRuleId(req, res, next) {
  const ruleId = Number(req.params.id)

  if (!Number.isInteger(ruleId) || ruleId <= 0) {
    return res.status(400).json({ message: 'Rule ID must be a positive integer' })
  }

  req.ruleId = ruleId
  return next()
}

function parsePresetId(req, res, next) {
  const presetId = Number(req.params.id)

  if (!Number.isInteger(presetId) || presetId <= 0) {
    return res.status(400).json({ message: 'Preset ID must be a positive integer' })
  }

  req.presetId = presetId
  return next()
}

function validateCreateBlockRule(req, res, next) {
  const { data, error } = buildBlockRuleData(req.body, true)

  if (error) {
    return res.status(400).json({ message: error })
  }

  req.blockRuleData = data
  return next()
}

function validateUpdateBlockRule(req, res, next) {
  const { data, error } = buildBlockRuleData(req.body)

  if (error) {
    return res.status(400).json({ message: error })
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'No editable block rule fields provided' })
  }

  req.blockRuleData = data
  return next()
}

module.exports = {
  allowedCategories,
  allowedSources,
  allowedTypes,
  normalizeDomain,
  parsePresetId,
  parseRuleId,
  validateCreateBlockRule,
  validateUpdateBlockRule,
}
