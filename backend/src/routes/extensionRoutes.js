const express = require('express')
const extensionController = require('../controllers/extensionController')
const requireAuth = require('../middleware/authMiddleware')
const {
  validateBlockAttempt,
  validateConsumptionEvent,
  validateExtensionStatus,
} = require('../middleware/extensionValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/sync', extensionController.sync)
router.get('/mission-state', extensionController.missionState)
router.get('/effective-rules', extensionController.effectiveRules)
router.get('/consumption-state', extensionController.consumptionState)
router.post('/block-attempt', validateBlockAttempt, extensionController.blockAttempt)
router.post('/consumption-event', validateConsumptionEvent, extensionController.consumptionEvent)
router.get('/status', extensionController.status)
router.post('/status', validateExtensionStatus, extensionController.updateStatus)

module.exports = router
