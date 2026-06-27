function parseMonth(value) {
  const month = Number(value)
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null
}

function parseYear(value) {
  const year = Number(value)
  return Number.isInteger(year) && year >= 1970 && year <= 3000 ? year : null
}

function validateMonthlyReviewQuery(req, res, next) {
  const { month, year } = req.query

  if ((month && !year) || (!month && year)) {
    return res.status(400).json({ message: 'Both month and year are required for a custom monthly review' })
  }

  if (month !== undefined && parseMonth(month) === null) {
    return res.status(400).json({ message: 'month must be an integer between 1 and 12' })
  }

  if (year !== undefined && parseYear(year) === null) {
    return res.status(400).json({ message: 'year must be a valid four digit year' })
  }

  return next()
}

function validateMonthlyReviewParams(req, res, next) {
  if (parseYear(req.params.year) === null) {
    return res.status(400).json({ message: 'year must be a valid four digit year' })
  }

  if (parseMonth(req.params.month) === null) {
    return res.status(400).json({ message: 'month must be an integer between 1 and 12' })
  }

  return next()
}

module.exports = {
  validateMonthlyReviewParams,
  validateMonthlyReviewQuery,
}
