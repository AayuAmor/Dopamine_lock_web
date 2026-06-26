const {
  createLog,
  deleteLog,
  getConsumptionSummary,
  getIdentityConsumptionStats,
  getLogs,
  getPlatformUsage,
  getTimeline,
  getUserLimits,
  getWeeklyAnalytics,
  updateLimits,
} = require('../services/consumptionService')

function handleConsumptionError(error, res, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function summary(req, res) {
  try {
    return res.json({ summary: await getConsumptionSummary(req.user.id) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to load consumption summary')
  }
}

async function platforms(req, res) {
  try {
    return res.json({ platforms: await getPlatformUsage(req.user.id) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to load consumption platforms')
  }
}

async function limits(req, res) {
  try {
    return res.json({ limits: await getUserLimits(req.user.id) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to load consumption limits')
  }
}

async function updateUserLimits(req, res) {
  try {
    return res.json({ limits: await updateLimits(req.user.id, req.body) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to update consumption limits')
  }
}

async function logs(req, res) {
  try {
    return res.json({ logs: await getLogs(req.user.id) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to load consumption logs')
  }
}

async function createManualLog(req, res) {
  try {
    return res.status(201).json({ log: await createLog(req.user.id, req.body) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to create consumption log')
  }
}

async function deleteUserLog(req, res) {
  try {
    await deleteLog(req.user.id, req.logId)
    return res.status(204).send()
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to delete consumption log')
  }
}

async function timeline(req, res) {
  try {
    return res.json({ timeline: await getTimeline(req.user.id) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to load consumption timeline')
  }
}

async function weekly(req, res) {
  try {
    return res.json({ weekly: await getWeeklyAnalytics(req.user.id) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to load weekly consumption analytics')
  }
}

async function identity(req, res) {
  try {
    return res.json({ identity: await getIdentityConsumptionStats(req.user.id) })
  } catch (error) {
    return handleConsumptionError(error, res, 'Unable to load identity consumption statistics')
  }
}

module.exports = {
  createManualLog,
  deleteUserLog,
  identity,
  limits,
  logs,
  platforms,
  summary,
  timeline,
  updateUserLimits,
  weekly,
}
