const express = require('express')
const {
  identity,
  progression,
  recalculate,
  summary,
  traits,
} = require('../controllers/identityController')
const requireAuth = require('../middleware/authMiddleware')

const router = express.Router()

router.use(requireAuth)

router.get('/', identity)
router.get('/traits', traits)
router.get('/progression', progression)
router.get('/summary', summary)
router.post('/recalculate', recalculate)

module.exports = router
