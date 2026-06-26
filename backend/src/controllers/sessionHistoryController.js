const {
  getHistory,
  getMonth,
  getSession,
  getSummary,
  getToday,
  getWeek,
} = require('../services/sessionHistoryService')

function handleHistoryError(error, res, fallbackMessage) {
  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function listHistory(req, res) {
  try {
    const history = await getHistory(req.user.id, req.query)
    return res.json(history)
  } catch (error) {
    return handleHistoryError(error, res, 'Unable to load session history')
  }
}

async function detailHistory(req, res) {
  try {
    const session = await getSession(req.user.id, req.sessionId)

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    return res.json({ session })
  } catch (error) {
    return handleHistoryError(error, res, 'Unable to load session details')
  }
}

async function summaryHistory(req, res) {
  try {
    const summary = await getSummary(req.user.id)
    return res.json({ summary })
  } catch (error) {
    return handleHistoryError(error, res, 'Unable to load session summary')
  }
}

async function todayHistory(req, res) {
  try {
    const history = await getToday(req.user.id, req.query)
    return res.json(history)
  } catch (error) {
    return handleHistoryError(error, res, 'Unable to load today session history')
  }
}

async function weekHistory(req, res) {
  try {
    const history = await getWeek(req.user.id, req.query)
    return res.json(history)
  } catch (error) {
    return handleHistoryError(error, res, 'Unable to load weekly session history')
  }
}

async function monthHistory(req, res) {
  try {
    const history = await getMonth(req.user.id, req.query)
    return res.json(history)
  } catch (error) {
    return handleHistoryError(error, res, 'Unable to load monthly session history')
  }
}

module.exports = {
  detailHistory,
  listHistory,
  monthHistory,
  summaryHistory,
  todayHistory,
  weekHistory,
}
