const extensionService = require('../services/extensionService')

function handleExtensionError(error, res, fallbackMessage) {
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message })
  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

function endpoint(serviceMethod, responseKey, fallbackMessage) {
  return async (req, res) => {
    try {
      const data = await serviceMethod(req.user.id, req.body)
      return res.json({ [responseKey]: data })
    } catch (error) {
      return handleExtensionError(error, res, fallbackMessage)
    }
  }
}

async function sync(req, res) {
  try {
    return res.json({ sync: await extensionService.getSyncState(req.user.id) })
  } catch (error) {
    return handleExtensionError(error, res, 'Unable to sync extension state')
  }
}

async function blockAttempt(req, res) {
  try {
    return res.status(201).json({ attempt: await extensionService.recordBlockAttempt(req.user.id, req.body) })
  } catch (error) {
    return handleExtensionError(error, res, 'Unable to record blocked attempt')
  }
}

async function consumptionEvent(req, res) {
  try {
    return res.status(201).json({ log: await extensionService.recordConsumptionEvent(req.user.id, req.body) })
  } catch (error) {
    return handleExtensionError(error, res, 'Unable to record consumption event')
  }
}

async function updateStatus(req, res) {
  try {
    return res.json({ status: await extensionService.updateExtensionStatus(req.user.id, req.body) })
  } catch (error) {
    return handleExtensionError(error, res, 'Unable to update extension status')
  }
}

module.exports = {
  blockAttempt,
  consumptionEvent,
  consumptionState: endpoint(extensionService.getConsumptionState, 'consumptionState', 'Unable to load extension consumption state'),
  effectiveRules: endpoint(extensionService.getEffectiveRules, 'rules', 'Unable to load extension rules'),
  missionState: endpoint(extensionService.getMissionState, 'missionState', 'Unable to load extension mission state'),
  status: endpoint(extensionService.getExtensionStatus, 'status', 'Unable to load extension status'),
  sync,
  updateStatus,
}
