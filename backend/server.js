require('dotenv').config()

const cors = require('cors')
const express = require('express')
const path = require('path')
const authRoutes = require('./src/routes/authRoutes')
const missionSessionRoutes = require('./src/routes/missionSessionRoutes')
const missionRoutes = require('./src/routes/missionRoutes')
const profileRoutes = require('./src/routes/profileRoutes')

const app = express()
const PORT = process.env.PORT || 5000
const defaultOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173']
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked origin: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/mission-session', missionSessionRoutes)
app.use('/api/missions', missionRoutes)
app.use('/api/profile', profileRoutes)

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
})

app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Dopamine Lock backend running on port ${PORT}`)
})
