const {
  getDisciplineScore,
  getScoreBreakdown,
  getScoreEvents,
  getScoreTrend,
  rebuildScoreForUser,
} = require('../services/disciplineScoreService')

function handleScoreError(error, res, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function scoreSummary(req, res) {
  try {
    const score = await getDisciplineScore(req.user.id)
    return res.json({ score })
  } catch (error) {
    return handleScoreError(error, res, 'Unable to load discipline score')
  }
}

async function scoreBreakdown(req, res) {
  try {
    const breakdown = await getScoreBreakdown(req.user.id)
    return res.json({ breakdown })
  } catch (error) {
    return handleScoreError(error, res, 'Unable to load discipline score breakdown')
  }
}

async function scoreTrend(req, res) {
  try {
    const trend = await getScoreTrend(req.user.id)
    return res.json({ trend })
  } catch (error) {
    return handleScoreError(error, res, 'Unable to load discipline score trend')
  }
}

async function scoreEvents(req, res) {
  try {
    const events = await getScoreEvents(req.user.id)
    return res.json({ events })
  } catch (error) {
    return handleScoreError(error, res, 'Unable to load discipline score events')
  }
}

async function recalculateScore(req, res) {
  try {
    const score = await rebuildScoreForUser(req.user.id)
    return res.json({ score })
  } catch (error) {
    return handleScoreError(error, res, 'Unable to recalculate discipline score')
  }
}

module.exports = {
  recalculateScore,
  scoreBreakdown,
  scoreEvents,
  scoreSummary,
  scoreTrend,
}
