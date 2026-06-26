function validateMissionId(req, res, next) {
  const missionId = Number(req.params.missionId || req.params.id)

  if (!Number.isInteger(missionId) || missionId <= 0) {
    return res.status(400).json({ message: 'Mission ID must be a positive integer' })
  }

  req.missionId = missionId
  return next()
}

function cleanSessionNotes(req, _res, next) {
  if (req.body.notes !== undefined) {
    req.sessionNotes = String(req.body.notes || '').trim() || null
  }

  return next()
}

module.exports = {
  cleanSessionNotes,
  validateMissionId,
}
