const express = require('express')
const { dashboard } = require('../controllers/dashboardController')
const requireAuth = require('../middleware/authMiddleware')

const router = express.Router()

router.use(requireAuth)
router.get('/', dashboard)

module.exports = router
