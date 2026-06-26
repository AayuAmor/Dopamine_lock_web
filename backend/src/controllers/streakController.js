const {
  getCalendarMonth,
  getMilestones,
  getStreakSummary,
  getWeeklyConsistency,
} = require('../services/streakService')

function handleStreakError(error, res, fallbackMessage) {
  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

async function summary(req, res) {
  try {
    const streak = await getStreakSummary(req.user.id)
    return res.json({ streak })
  } catch (error) {
    return handleStreakError(error, res, 'Unable to load streak summary')
  }
}

async function calendar(req, res) {
  try {
    const calendarMonth = await getCalendarMonth(req.user.id, req.calendarMonth, req.calendarYear)
    return res.json({ calendar: calendarMonth })
  } catch (error) {
    return handleStreakError(error, res, 'Unable to load streak calendar')
  }
}

async function weekly(req, res) {
  try {
    const week = await getWeeklyConsistency(req.user.id)
    return res.json({ week })
  } catch (error) {
    return handleStreakError(error, res, 'Unable to load weekly consistency')
  }
}

async function milestones(req, res) {
  try {
    const items = await getMilestones(req.user.id)
    return res.json({ milestones: items })
  } catch (error) {
    return handleStreakError(error, res, 'Unable to load streak milestones')
  }
}

module.exports = {
  calendar,
  milestones,
  summary,
  weekly,
}
