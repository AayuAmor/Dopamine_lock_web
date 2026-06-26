const express = require('express')
const {
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
} = require('../controllers/blockManagerController')
const requireAuth = require('../middleware/authMiddleware')
const {
  parsePresetId,
  parseRuleId,
  validateCreateBlockRule,
  validateUpdateBlockRule,
} = require('../middleware/blockManagerValidation')

const router = express.Router()

router.use(requireAuth)

router.get('/rules', getRules)
router.get('/rules/:id', parseRuleId, getRule)
router.post('/rules', validateCreateBlockRule, createBlockRule)
router.patch('/rules/:id', parseRuleId, validateUpdateBlockRule, updateBlockRule)
router.delete('/rules/:id', parseRuleId, deleteBlockRule)
router.patch('/rules/:id/toggle', parseRuleId, toggleBlockRule)

router.get('/presets', getPresets)
router.post('/presets/:id/enable', parsePresetId, enablePreset)
router.post('/presets/:id/disable', parsePresetId, disablePreset)

router.get('/effective-rules', effectiveRules)

module.exports = router
