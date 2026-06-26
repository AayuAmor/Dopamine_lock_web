const express = require('express')
const {
  calendar,
  milestones,
  summary,
  weekly,
} = require('../controllers/streakController')
const requireAuth = require('../middleware/authMiddleware')
const { validateCalendarQuery } = require('../middleware/streakValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/summary', summary)
router.get('/calendar', validateCalendarQuery, calendar)
router.get('/weekly', weekly)
router.get('/milestones', milestones)

module.exports = router
