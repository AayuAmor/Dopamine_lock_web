function parseSessionId(req, res, next) {
  const sessionId = Number(req.params.id)

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return res.status(400).json({ message: 'Session ID must be a positive integer' })
  }

  req.sessionId = sessionId
  return next()
}

module.exports = {
  parseSessionId,
}
