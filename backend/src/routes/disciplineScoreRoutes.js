const express = require('express')
const {
  recalculateScore,
  scoreBreakdown,
  scoreEvents,
  scoreSummary,
  scoreTrend,
} = require('../controllers/disciplineScoreController')
const requireAuth = require('../middleware/authMiddleware')

const router = express.Router()

router.use(requireAuth)

router.get('/', scoreSummary)
router.get('/breakdown', scoreBreakdown)
router.get('/trend', scoreTrend)
router.get('/events', scoreEvents)
router.post('/recalculate', recalculateScore)

module.exports = router
