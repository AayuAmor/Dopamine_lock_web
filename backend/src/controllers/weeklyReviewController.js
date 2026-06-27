const {
  generateReview,
  getCurrentReview,
  getHistory,
  getWeekReview,
} = require('../services/weeklyReviewService')

function handleReviewError(error, res, fallbackMessage) {
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message })
  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function currentWeeklyReview(req, res) {
  try {
    return res.json({ review: await getCurrentReview(req.user.id, req.query) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to load weekly review')
  }
}

async function weeklyHistory(req, res) {
  try {
    return res.json({ history: await getHistory(req.user.id) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to load weekly review history')
  }
}

async function weekReview(req, res) {
  try {
    return res.json({ review: await getWeekReview(req.user.id, req.params.weekStart) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to load weekly review')
  }
}

async function generateWeeklyReview(req, res) {
  try {
    return res.json({ review: await generateReview(req.user.id, req.query) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to generate weekly review')
  }
}

module.exports = {
  currentWeeklyReview,
  generateWeeklyReview,
  weekReview,
  weeklyHistory,
}
