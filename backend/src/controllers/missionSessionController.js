const {
  abandonCurrentSession,
  completeCurrentSession,
  getCurrentSession,
  getSessionHistory,
  pauseCurrentSession,
  resumeCurrentSession,
  startMissionSession,
} = require('../services/missionSessionService')

function handleSessionError(error, res, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function currentSession(req, res) {
  try {
    const session = await getCurrentSession(req.user.id)
    return res.json({ session })
  } catch (error) {
    return handleSessionError(error, res, 'Unable to load current mission session')
  }
}

async function sessionHistory(req, res) {
  try {
    const sessions = await getSessionHistory(req.user.id)
    return res.json({ sessions })
  } catch (error) {
    return handleSessionError(error, res, 'Unable to load mission session history')
  }
}

async function startSession(req, res) {
  try {
    const session = await startMissionSession(req.user.id, req.missionId)
    return res.status(201).json({ session })
  } catch (error) {
    return handleSessionError(error, res, 'Unable to start mission session')
  }
}

async function pauseSession(req, res) {
  try {
    const session = await pauseCurrentSession(req.user.id)
    return res.json({ session })
  } catch (error) {
    return handleSessionError(error, res, 'Unable to pause mission session')
  }
}

async function resumeSession(req, res) {
  try {
    const session = await resumeCurrentSession(req.user.id)
    return res.json({ session })
  } catch (error) {
    return handleSessionError(error, res, 'Unable to resume mission session')
  }
}

async function completeSession(req, res) {
  try {
    const session = await completeCurrentSession(req.user.id, req.sessionNotes)
    return res.json({ session })
  } catch (error) {
    return handleSessionError(error, res, 'Unable to complete mission session')
  }
}

async function abandonSession(req, res) {
  try {
    const session = await abandonCurrentSession(req.user.id, req.sessionNotes)
    return res.json({ session })
  } catch (error) {
    return handleSessionError(error, res, 'Unable to abandon mission session')
  }
}

module.exports = {
  abandonSession,
  completeSession,
  currentSession,
  pauseSession,
  resumeSession,
  sessionHistory,
  startSession,
}
