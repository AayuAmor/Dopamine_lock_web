const express = require('express')
const {
  abandonSession,
  completeSession,
  currentSession,
  pauseSession,
  resumeSession,
  sessionHistory,
  startSession,
} = require('../controllers/missionSessionController')
const requireAuth = require('../middleware/authMiddleware')
const {
  cleanSessionNotes,
  validateMissionId,
} = require('../middleware/missionSessionValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/current', currentSession)
router.get('/history', sessionHistory)
router.post('/start/:missionId', validateMissionId, startSession)
router.post('/pause', pauseSession)
router.post('/resume', resumeSession)
router.post('/complete', cleanSessionNotes, completeSession)
router.post('/abandon', cleanSessionNotes, abandonSession)

module.exports = router
