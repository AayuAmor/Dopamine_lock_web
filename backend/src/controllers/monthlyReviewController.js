const {
  generateReview,
  getCurrentReview,
  getHistory,
  getMonthlyReview,
} = require('../services/monthlyReviewService')

function handleReviewError(error, res, fallbackMessage) {
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message })
  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function currentMonthlyReview(req, res) {
  try {
    return res.json({ review: await getCurrentReview(req.user.id, req.query) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to load monthly review')
  }
}

async function monthlyHistory(req, res) {
  try {
    return res.json({ history: await getHistory(req.user.id) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to load monthly review history')
  }
}

async function monthReview(req, res) {
  try {
    return res.json({ review: await getMonthlyReview(req.user.id, Number(req.params.year), Number(req.params.month)) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to load monthly review')
  }
}

async function generateMonthlyReview(req, res) {
  try {
    return res.json({ review: await generateReview(req.user.id, req.query) })
  } catch (error) {
    return handleReviewError(error, res, 'Unable to generate monthly review')
  }
}

module.exports = {
  currentMonthlyReview,
  generateMonthlyReview,
  monthReview,
  monthlyHistory,
}
