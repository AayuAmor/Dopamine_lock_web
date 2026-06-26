const express = require('express')
const {
  detailHistory,
  listHistory,
  monthHistory,
  summaryHistory,
  todayHistory,
  weekHistory,
} = require('../controllers/sessionHistoryController')
const requireAuth = require('../middleware/authMiddleware')
const { parseSessionId } = require('../middleware/sessionHistoryValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/', listHistory)
router.get('/summary', summaryHistory)
router.get('/today', todayHistory)
router.get('/week', weekHistory)
router.get('/month', monthHistory)
router.get('/:id', parseSessionId, detailHistory)

module.exports = router
