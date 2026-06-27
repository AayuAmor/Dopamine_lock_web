'use strict'

const express = require('express')
const {
  listAchievements,
  listUnlocked,
  listLocked,
  achievementSummary,
  achievementDetail,
  recalculate,
} = require('../controllers/achievementController')
const requireAuth = require('../middleware/authMiddleware')

const router = express.Router()

router.use(requireAuth)

router.get('/summary', achievementSummary)
router.get('/unlocked', listUnlocked)
router.get('/locked', listLocked)
router.get('/', listAchievements)
router.get('/:id', achievementDetail)
router.post('/recalculate', recalculate)

module.exports = router
