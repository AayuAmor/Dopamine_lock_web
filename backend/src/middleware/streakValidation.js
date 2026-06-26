function validateCalendarQuery(req, res, next) {
  const now = new Date()
  const month = req.query.month === undefined ? now.getMonth() + 1 : Number(req.query.month)
  const year = req.query.year === undefined ? now.getFullYear() : Number(req.query.year)

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Month must be an integer from 1 to 12' })
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ message: 'Year must be between 2000 and 2100' })
  }

  req.calendarMonth = month
  req.calendarYear = year
  return next()
}

module.exports = {
  validateCalendarQuery,
}
