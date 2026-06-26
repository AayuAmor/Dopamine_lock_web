const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const [scheme, token] = authHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication token is required' })
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' })
    }

    req.user = user
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    console.error('Auth middleware error:', error)
    return res.status(500).json({ message: 'Authentication failed' })
  }
}

module.exports = requireAuth
