const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { formatProfile } = require('../services/profileService')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function publicUser(user) {
  return formatProfile(user)
}

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  )
}

function validateAuthInput({ fullName, email, password }, requireName = false) {
  if (requireName && !String(fullName || '').trim()) {
    return 'Full name is required'
  }

  if (!email || !password) {
    return 'Email and password are required'
  }

  if (!EMAIL_REGEX.test(normalizeEmail(email))) {
    return 'Enter a valid email address'
  }

  if (String(password).length < 6) {
    return 'Password must be at least 6 characters'
  }

  return null
}

async function register(req, res) {
  try {
    const fullName = String(req.body.fullName || req.body.full_name || '').trim()
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')
    const validationError = validateAuthInput({ fullName, email, password }, true)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const createdUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
      },
    })
    const user = publicUser(createdUser)
    const token = signToken(user)

    return res.status(201).json({ token, user })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    console.error('Register error:', error)
    return res.status(500).json({ message: 'Unable to register user' })
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')
    const validationError = validateAuthInput({ email, password })

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const userRow = await prisma.user.findUnique({
      where: { email },
    })

    if (!userRow) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, userRow.passwordHash)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = publicUser(userRow)
    const token = signToken(user)

    return res.json({ token, user })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Unable to log in' })
  }
}

async function me(req, res) {
  return res.json({ user: publicUser(req.user) })
}

module.exports = {
  login,
  me,
  publicUser,
  register,
}
