const prisma = require('../config/prisma')

function formatRule(rule) {
  return {
    id: rule.id,
    userId: rule.userId,
    domain: rule.domain,
    type: rule.type,
    category: rule.category,
    reason: rule.reason,
    active: rule.active,
    source: rule.source,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

function formatPreset(preset, userPreset) {
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    category: preset.category,
    websites: preset.websites || [],
    active: preset.active,
    enabled: Boolean(userPreset?.enabled),
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
  }
}

async function getRulesByUserId(userId) {
  const rules = await prisma.blockRule.findMany({
    where: { userId },
    orderBy: [
      { active: 'desc' },
      { type: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return rules.map(formatRule)
}

async function getRuleById(userId, ruleId) {
  const rule = await prisma.blockRule.findFirst({
    where: {
      id: ruleId,
      userId,
    },
  })

  return rule ? formatRule(rule) : null
}

async function createRule(userId, data) {
  const rule = await prisma.blockRule.create({
    data: {
      ...data,
      userId,
    },
  })

  return formatRule(rule)
}

async function updateRule(userId, ruleId, data) {
  const existing = await getRuleById(userId, ruleId)

  if (!existing) {
    return null
  }

  const rule = await prisma.blockRule.update({
    where: { id: ruleId },
    data,
  })

  return formatRule(rule)
}

async function deleteRule(userId, ruleId) {
  const existing = await getRuleById(userId, ruleId)

  if (!existing) {
    return null
  }

  await prisma.blockRule.delete({
    where: { id: ruleId },
  })

  return existing
}

async function toggleRule(userId, ruleId) {
  const existing = await getRuleById(userId, ruleId)

  if (!existing) {
    return null
  }

  const rule = await prisma.blockRule.update({
    where: { id: ruleId },
    data: {
      active: !existing.active,
    },
  })

  return formatRule(rule)
}

async function getPresetsForUser(userId) {
  const presets = await prisma.presetBlockList.findMany({
    where: { active: true },
    include: {
      userPresets: {
        where: { userId },
      },
    },
    orderBy: { name: 'asc' },
  })

  return presets.map((preset) => formatPreset(preset, preset.userPresets[0]))
}

async function setPresetEnabled(userId, presetId, enabled) {
  const preset = await prisma.presetBlockList.findFirst({
    where: {
      id: presetId,
      active: true,
    },
  })

  if (!preset) {
    return null
  }

  const userPreset = await prisma.userPresetBlockList.upsert({
    where: {
      userId_presetBlockListId: {
        userId,
        presetBlockListId: presetId,
      },
    },
    update: { enabled },
    create: {
      enabled,
      presetBlockListId: presetId,
      userId,
    },
  })

  return formatPreset(preset, userPreset)
}

async function getEffectiveRules(userId) {
  const [rules, presets, currentSession] = await Promise.all([
    prisma.blockRule.findMany({
      where: {
        userId,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userPresetBlockList.findMany({
      where: {
        userId,
        enabled: true,
        presetBlockList: { active: true },
      },
      include: { presetBlockList: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.missionSession.findFirst({
      where: {
        userId,
        endedAt: null,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
      include: { mission: true },
      orderBy: { startedAt: 'desc' },
    }),
  ])

  const customBlocked = rules.filter((rule) => rule.type === 'BLOCKED').map(formatRule)
  const customAllowed = rules.filter((rule) => rule.type === 'ALLOWED').map(formatRule)
  const presetBlocked = presets.flatMap((userPreset) =>
    (userPreset.presetBlockList.websites || []).map((domain) => ({
      category: userPreset.presetBlockList.category,
      domain,
      presetId: userPreset.presetBlockList.id,
      presetName: userPreset.presetBlockList.name,
      source: 'PRESET',
      type: 'BLOCKED',
    })),
  )
  const missionBlocked = currentSession?.mission
    ? (currentSession.mission.blockedWebsites || []).map((domain) => ({
      category: 'CUSTOM',
      domain,
      missionId: currentSession.mission.id,
      missionTitle: currentSession.mission.title,
      source: 'MISSION',
      type: 'BLOCKED',
    }))
    : []
  const missionAllowed = currentSession?.mission
    ? (currentSession.mission.allowedWebsites || []).map((domain) => ({
      category: 'CUSTOM',
      domain,
      missionId: currentSession.mission.id,
      missionTitle: currentSession.mission.title,
      source: 'MISSION',
      type: 'ALLOWED',
    }))
    : []

  const blockedDomains = [
    ...customBlocked.map((rule) => rule.domain),
    ...presetBlocked.map((rule) => rule.domain),
    ...missionBlocked.map((rule) => rule.domain),
  ]
  const allowedDomains = [
    ...customAllowed.map((rule) => rule.domain),
    ...missionAllowed.map((rule) => rule.domain),
  ]

  return {
    allowedDomains: [...new Set(allowedDomains)],
    blockedDomains: [...new Set(blockedDomains)],
    customAllowed,
    customBlocked,
    missionAllowed,
    missionBlocked,
    presetBlocked,
    presets: presets.map((userPreset) => formatPreset(userPreset.presetBlockList, userPreset)),
  }
}

module.exports = {
  createRule,
  deleteRule,
  getEffectiveRules,
  getPresetsForUser,
  getRuleById,
  getRulesByUserId,
  setPresetEnabled,
  toggleRule,
  updateRule,
}
