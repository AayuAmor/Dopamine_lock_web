const express = require('express')
const analyticsController = require('../controllers/analyticsController')
const requireAuth = require('../middleware/authMiddleware')
const { validateAnalyticsQuery } = require('../middleware/analyticsValidation')

const router = express.Router()

router.use(requireAuth)
router.use(validateAnalyticsQuery)

router.get('/dashboard', analyticsController.dashboard)
router.get('/overview', analyticsController.overview)
router.get('/focus', analyticsController.focus)
router.get('/missions', analyticsController.missions)
router.get('/consumption', analyticsController.consumption)
router.get('/discipline', analyticsController.discipline)
router.get('/streak', analyticsController.streak)
router.get('/weekly', analyticsController.weekly)
router.get('/monthly', analyticsController.monthly)

module.exports = router
