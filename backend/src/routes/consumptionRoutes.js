const express = require('express')
const {
  createManualLog,
  deleteUserLog,
  identity,
  limits,
  logs,
  platforms,
  summary,
  timeline,
  updateUserLimits,
  weekly,
} = require('../controllers/consumptionController')
const requireAuth = require('../middleware/authMiddleware')
const {
  validateLimitsPayload,
  validateLogId,
  validateLogPayload,
} = require('../middleware/consumptionValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/summary', summary)
router.get('/platforms', platforms)
router.get('/limits', limits)
router.patch('/limits', validateLimitsPayload, updateUserLimits)
router.get('/logs', logs)
router.post('/logs', validateLogPayload, createManualLog)
router.delete('/logs/:id', validateLogId, deleteUserLog)
router.get('/timeline', timeline)
router.get('/weekly', weekly)
router.get('/identity', identity)

module.exports = router
