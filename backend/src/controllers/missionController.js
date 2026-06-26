const {
  archiveMission: archiveMissionById,
  createMission: createMissionForUser,
  getMissionById,
  getMissionsByUserId,
  softDeleteMission,
  toggleFavoriteMission,
  updateMission: updateMissionById,
} = require('../services/missionService')

function parseMissionId(req, res) {
  const missionId = Number(req.params.id)

  if (!Number.isInteger(missionId) || missionId <= 0) {
    res.status(400).json({ message: 'Mission ID must be a positive integer' })
    return null
  }

  return missionId
}

function optionalBoolean(value) {
  if (value === undefined) {
    return undefined
  }

  if (value === 'false') {
    return false
  }

  if (value === 'true') {
    return true
  }

  return Boolean(value)
}

async function getMissions(req, res) {
  try {
    const missions = await getMissionsByUserId(req.user.id)
    return res.json({ missions })
  } catch (error) {
    console.error('Mission list error:', error)
    return res.status(500).json({ message: 'Unable to load missions' })
  }
}

async function getMission(req, res) {
  try {
    const missionId = parseMissionId(req, res)

    if (!missionId) {
      return undefined
    }

    const mission = await getMissionById(req.user.id, missionId)

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    return res.json({ mission })
  } catch (error) {
    console.error('Mission detail error:', error)
    return res.status(500).json({ message: 'Unable to load mission' })
  }
}

async function createMission(req, res) {
  try {
    const mission = await createMissionForUser(req.user.id, req.missionData)
    return res.status(201).json({ mission })
  } catch (error) {
    console.error('Mission create error:', error)
    return res.status(500).json({ message: 'Unable to create mission' })
  }
}

async function updateMission(req, res) {
  try {
    const missionId = parseMissionId(req, res)

    if (!missionId) {
      return undefined
    }

    const mission = await updateMissionById(req.user.id, missionId, req.missionData)

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    return res.json({ mission })
  } catch (error) {
    console.error('Mission update error:', error)
    return res.status(500).json({ message: 'Unable to update mission' })
  }
}

async function deleteMission(req, res) {
  try {
    const missionId = parseMissionId(req, res)

    if (!missionId) {
      return undefined
    }

    const mission = await softDeleteMission(req.user.id, missionId)

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    return res.json({ mission })
  } catch (error) {
    console.error('Mission delete error:', error)
    return res.status(500).json({ message: 'Unable to delete mission' })
  }
}

async function toggleFavorite(req, res) {
  try {
    const missionId = parseMissionId(req, res)

    if (!missionId) {
      return undefined
    }

    const mission = await toggleFavoriteMission(req.user.id, missionId, optionalBoolean(req.body.favorite))

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    return res.json({ mission })
  } catch (error) {
    console.error('Mission favorite error:', error)
    return res.status(500).json({ message: 'Unable to update favorite mission' })
  }
}

async function archiveMission(req, res) {
  try {
    const missionId = parseMissionId(req, res)

    if (!missionId) {
      return undefined
    }

    const archived = req.body.archived === undefined ? true : optionalBoolean(req.body.archived)
    const mission = await archiveMissionById(req.user.id, missionId, archived)

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    return res.json({ mission })
  } catch (error) {
    console.error('Mission archive error:', error)
    return res.status(500).json({ message: 'Unable to archive mission' })
  }
}

module.exports = {
  archiveMission,
  createMission,
  deleteMission,
  getMission,
  getMissions,
  toggleFavorite,
  updateMission,
}
