const {
  getIdentity,
  getProgression,
  getSummary,
  getTraits,
  recalculateIdentity,
} = require('../services/identityService')

function handleIdentityError(error, res, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function identity(req, res) {
  try {
    return res.json({ identity: await getIdentity(req.user.id) })
  } catch (error) {
    return handleIdentityError(error, res, 'Unable to load identity')
  }
}

async function traits(req, res) {
  try {
    return res.json({ traits: await getTraits(req.user.id) })
  } catch (error) {
    return handleIdentityError(error, res, 'Unable to load identity traits')
  }
}

async function progression(req, res) {
  try {
    return res.json({ progression: await getProgression(req.user.id) })
  } catch (error) {
    return handleIdentityError(error, res, 'Unable to load identity progression')
  }
}

async function summary(req, res) {
  try {
    return res.json({ summary: await getSummary(req.user.id) })
  } catch (error) {
    return handleIdentityError(error, res, 'Unable to load identity summary')
  }
}

async function recalculate(req, res) {
  try {
    return res.json({ identity: await recalculateIdentity(req.user.id) })
  } catch (error) {
    return handleIdentityError(error, res, 'Unable to recalculate identity')
  }
}

module.exports = {
  identity,
  progression,
  recalculate,
  summary,
  traits,
}
