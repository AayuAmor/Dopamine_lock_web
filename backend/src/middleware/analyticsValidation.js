function isValidDate(value) {
  if (!value) return true
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function validateAnalyticsQuery(req, res, next) {
  const { endDate, month, startDate, year } = req.query

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({ message: 'startDate and endDate must use YYYY-MM-DD format' })
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ message: 'startDate must be before or equal to endDate' })
  }

  if (month !== undefined) {
    const parsedMonth = Number(month)
    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ message: 'month must be an integer between 1 and 12' })
    }
  }

  if (year !== undefined) {
    const parsedYear = Number(year)
    if (!Number.isInteger(parsedYear) || parsedYear < 1970 || parsedYear > 3000) {
      return res.status(400).json({ message: 'year must be a valid four digit year' })
    }
  }

  return next()
}

module.exports = { validateAnalyticsQuery }
