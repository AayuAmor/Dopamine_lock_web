const allowedCategories = new Set([
  'STUDY',
  'CODING',
  'FITNESS',
  'READING',
  'PROJECT',
  'DIGITAL_DETOX',
  'CONSISTENCY',
  'CUSTOM',
])
const allowedPriorities = new Set(['LOW', 'MEDIUM', 'HIGH'])
const allowedStatuses = new Set(['ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED'])

function cleanString(value) {
  if (value === undefined || value === null) return undefined
  return String(value).trim()
}

function cleanNumber(value, fieldLabel, { positive = false, nonNegative = false } = {}) {
  if (value === undefined || value === null || value === '') return { value: undefined }
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return { error: `${fieldLabel} must be a valid number` }
  if (positive && numberValue <= 0) return { error: `${fieldLabel} must be positive` }
  if (nonNegative && numberValue < 0) return { error: `${fieldLabel} cannot be negative` }
  return { value: numberValue }
}

function cleanDate(value) {
  if (value === undefined || value === null || value === '') return { value: undefined }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { error: 'Target date must be a valid date' }
  return { value: date }
}

function buildGoalData(body, requireAll = false) {
  const data = {}
  const title = cleanString(body.title)
  const description = cleanString(body.description)
  const category = cleanString(body.category)
  const priority = cleanString(body.priority)
  const status = cleanString(body.status)
  const unit = cleanString(body.unit)
  const targetValue = cleanNumber(body.targetValue, 'Target value', { positive: true })
  const currentValue = cleanNumber(body.currentValue, 'Current value', { nonNegative: true })
  const progressPercentage = cleanNumber(body.progressPercentage, 'Progress percentage', { nonNegative: true })
  const targetDate = cleanDate(body.targetDate)

  if (requireAll && !title) return { error: 'Goal title is required' }
  if (title !== undefined) {
    if (!title) return { error: 'Goal title is required' }
    data.title = title
  }

  if (description !== undefined) data.description = description || null

  if (requireAll && !category) return { error: 'Goal category is required' }
  if (category !== undefined) {
    if (!allowedCategories.has(category)) return { error: 'Goal category is invalid' }
    data.category = category
  }

  if (requireAll && !priority) return { error: 'Goal priority is required' }
  if (priority !== undefined) {
    if (!allowedPriorities.has(priority)) return { error: 'Goal priority is invalid' }
    data.priority = priority
  }

  if (status !== undefined) {
    if (!allowedStatuses.has(status)) return { error: 'Goal status is invalid' }
    data.status = status
    data.archived = status === 'ARCHIVED'
  }

  if (targetValue.error) return { error: targetValue.error }
  if (targetValue.value !== undefined) data.targetValue = targetValue.value

  if (currentValue.error) return { error: currentValue.error }
  if (currentValue.value !== undefined) data.currentValue = currentValue.value

  if (progressPercentage.error) return { error: progressPercentage.error }
  if (progressPercentage.value !== undefined) data.progressPercentage = Math.round(Math.min(progressPercentage.value, 100))

  if (data.targetValue !== undefined && data.currentValue !== undefined && data.currentValue > data.targetValue) {
    return { error: 'Current value cannot exceed target value' }
  }

  if (unit !== undefined) data.unit = unit || null

  if (targetDate.error) return { error: targetDate.error }
  if (targetDate.value !== undefined) data.targetDate = targetDate.value

  return { data }
}

function validateCreateGoal(req, res, next) {
  const { data, error } = buildGoalData(req.body, true)
  if (error) return res.status(400).json({ message: error })
  req.goalData = data
  return next()
}

function validateUpdateGoal(req, res, next) {
  const { data, error } = buildGoalData(req.body)
  if (error) return res.status(400).json({ message: error })
  if (Object.keys(data).length === 0) return res.status(400).json({ message: 'No editable goal fields provided' })
  req.goalData = data
  return next()
}

function validateProgressUpdate(req, res, next) {
  const currentValue = cleanNumber(req.body.currentValue, 'Current value', { nonNegative: true })
  const progressPercentage = cleanNumber(req.body.progressPercentage, 'Progress percentage', { nonNegative: true })
  if (currentValue.error) return res.status(400).json({ message: currentValue.error })
  if (progressPercentage.error) return res.status(400).json({ message: progressPercentage.error })
  if (currentValue.value === undefined && progressPercentage.value === undefined) {
    return res.status(400).json({ message: 'Current value or progress percentage is required' })
  }
  req.goalProgressData = {
    currentValue: currentValue.value,
    progressPercentage: progressPercentage.value,
  }
  return next()
}

module.exports = {
  allowedCategories,
  allowedPriorities,
  allowedStatuses,
  validateCreateGoal,
  validateProgressUpdate,
  validateUpdateGoal,
}
