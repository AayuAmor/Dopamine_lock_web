const express = require('express')
const {
  currentWeeklyReview,
  generateWeeklyReview,
  weekReview,
  weeklyHistory,
} = require('../controllers/weeklyReviewController')
const requireAuth = require('../middleware/authMiddleware')
const {
  validateWeekStart,
  validateWeeklyReviewQuery,
} = require('../middleware/weeklyReviewValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/weekly', validateWeeklyReviewQuery, currentWeeklyReview)
router.get('/weekly/history', weeklyHistory)
router.get('/weekly/:weekStart', validateWeekStart, weekReview)
router.post('/weekly/generate', validateWeeklyReviewQuery, generateWeeklyReview)

module.exports = router
