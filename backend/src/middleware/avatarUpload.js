const fs = require('fs')
const path = require('path')
const multer = require('multer')

const avatarUploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars')
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

fs.mkdirSync(avatarUploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, avatarUploadDir)
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const safeId = `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}`
    callback(null, `${safeId}${extension}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'))
      return
    }

    callback(null, true)
  },
})

function handleAvatarUpload(req, res, next) {
  upload.single('avatar')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Avatar image must be 2MB or smaller' })
      }

      return res.status(400).json({ message: 'Invalid avatar upload' })
    }

    return res.status(400).json({ message: error.message || 'Invalid avatar upload' })
  })
}

module.exports = {
  avatarUploadDir,
  handleAvatarUpload,
}
