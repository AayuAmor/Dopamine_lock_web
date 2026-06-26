const express = require('express')
const {
  archiveMission,
  createMission,
  deleteMission,
  getMission,
  getMissions,
  toggleFavorite,
  updateMission,
} = require('../controllers/missionController')
const requireAuth = require('../middleware/authMiddleware')
const {
  validateCreateMission,
  validateUpdateMission,
} = require('../middleware/missionValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/', getMissions)
router.get('/:id', getMission)
router.post('/', validateCreateMission, createMission)
router.patch('/:id', validateUpdateMission, updateMission)
router.delete('/:id', deleteMission)
router.patch('/:id/favorite', toggleFavorite)
router.patch('/:id/archive', archiveMission)

module.exports = router
