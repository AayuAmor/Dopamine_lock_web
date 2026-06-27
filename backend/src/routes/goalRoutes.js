const express = require('express')
const {
  completeGoal,
  connectMission,
  createGoal,
  deleteGoal,
  getGoal,
  getGoalSummary,
  getGoals,
  pauseGoal,
  removeMission,
  resumeGoal,
  updateGoal,
  updateGoalProgress,
} = require('../controllers/goalController')
const requireAuth = require('../middleware/authMiddleware')
const {
  validateCreateGoal,
  validateProgressUpdate,
  validateUpdateGoal,
} = require('../middleware/goalValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/summary', getGoalSummary)
router.get('/', getGoals)
router.get('/:id', getGoal)
router.post('/', validateCreateGoal, createGoal)
router.patch('/:id', validateUpdateGoal, updateGoal)
router.delete('/:id', deleteGoal)
router.patch('/:id/progress', validateProgressUpdate, updateGoalProgress)
router.patch('/:id/complete', completeGoal)
router.patch('/:id/pause', pauseGoal)
router.patch('/:id/resume', resumeGoal)
router.post('/:id/missions/:missionId', connectMission)
router.delete('/:id/missions/:missionId', removeMission)

module.exports = router
