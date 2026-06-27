const MS_PER_DAY = 86400000

function isValidDate(value) {
  if (!value) return true
  const date = new Date(`${value}T00:00:00.000Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime())
}

function validateWeeklyReviewQuery(req, res, next) {
  const { startDate, endDate } = req.query

  if ((startDate && !endDate) || (!startDate && endDate)) {
    return res.status(400).json({ message: 'Both startDate and endDate are required for a custom weekly review' })
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({ message: 'startDate and endDate must use YYYY-MM-DD format' })
  }

  if (startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`)
    const end = new Date(`${endDate}T00:00:00.000Z`)
    if (start > end) return res.status(400).json({ message: 'startDate must be before or equal to endDate' })
    const days = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
    if (days > 7) return res.status(400).json({ message: 'Weekly review range cannot exceed 7 days' })
  }

  return next()
}

function validateWeekStart(req, res, next) {
  if (!isValidDate(req.params.weekStart)) {
    return res.status(400).json({ message: 'weekStart must use YYYY-MM-DD format' })
  }
  return next()
}

module.exports = {
  validateWeekStart,
  validateWeeklyReviewQuery,
}
