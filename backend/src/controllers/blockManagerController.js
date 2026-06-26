const {
  createRule,
  deleteRule,
  getEffectiveRules,
  getPresetsForUser,
  getRuleById,
  getRulesByUserId,
  setPresetEnabled,
  toggleRule,
  updateRule,
} = require('../services/blockManagerService')

function handleBlockError(error, res, fallbackMessage) {
  if (error.code === 'P2002') {
    return res.status(409).json({ message: 'This domain already exists for that rule type' })
  }

  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function getRules(req, res) {
  try {
    const rules = await getRulesByUserId(req.user.id)
    return res.json({ rules })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to load block rules')
  }
}

async function getRule(req, res) {
  try {
    const rule = await getRuleById(req.user.id, req.ruleId)

    if (!rule) {
      return res.status(404).json({ message: 'Block rule not found' })
    }

    return res.json({ rule })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to load block rule')
  }
}

async function createBlockRule(req, res) {
  try {
    const rule = await createRule(req.user.id, req.blockRuleData)
    return res.status(201).json({ rule })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to create block rule')
  }
}

async function updateBlockRule(req, res) {
  try {
    const rule = await updateRule(req.user.id, req.ruleId, req.blockRuleData)

    if (!rule) {
      return res.status(404).json({ message: 'Block rule not found' })
    }

    return res.json({ rule })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to update block rule')
  }
}

async function deleteBlockRule(req, res) {
  try {
    const rule = await deleteRule(req.user.id, req.ruleId)

    if (!rule) {
      return res.status(404).json({ message: 'Block rule not found' })
    }

    return res.json({ rule })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to delete block rule')
  }
}

async function toggleBlockRule(req, res) {
  try {
    const rule = await toggleRule(req.user.id, req.ruleId)

    if (!rule) {
      return res.status(404).json({ message: 'Block rule not found' })
    }

    return res.json({ rule })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to toggle block rule')
  }
}

async function getPresets(req, res) {
  try {
    const presets = await getPresetsForUser(req.user.id)
    return res.json({ presets })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to load preset block lists')
  }
}

async function enablePreset(req, res) {
  try {
    const preset = await setPresetEnabled(req.user.id, req.presetId, true)

    if (!preset) {
      return res.status(404).json({ message: 'Preset block list not found' })
    }

    return res.json({ preset })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to enable preset block list')
  }
}

async function disablePreset(req, res) {
  try {
    const preset = await setPresetEnabled(req.user.id, req.presetId, false)

    if (!preset) {
      return res.status(404).json({ message: 'Preset block list not found' })
    }

    return res.json({ preset })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to disable preset block list')
  }
}

async function effectiveRules(req, res) {
  try {
    const rules = await getEffectiveRules(req.user.id)
    return res.json({ rules })
  } catch (error) {
    return handleBlockError(error, res, 'Unable to load effective block rules')
  }
}

module.exports = {
  createBlockRule,
  deleteBlockRule,
  disablePreset,
  effectiveRules,
  enablePreset,
  getPresets,
  getRule,
  getRules,
  toggleBlockRule,
  updateBlockRule,
}
