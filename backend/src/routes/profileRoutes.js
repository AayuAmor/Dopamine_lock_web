const express = require('express')
const {
  getProfile,
  updateAvatar,
  updateProfile,
} = require('../controllers/profileController')
const requireAuth = require('../middleware/authMiddleware')
const { handleAvatarUpload } = require('../middleware/avatarUpload')

const router = express.Router()

router.use(requireAuth)

router.get('/', getProfile)
router.patch('/', updateProfile)
router.post('/avatar', handleAvatarUpload, updateAvatar)

module.exports = router
