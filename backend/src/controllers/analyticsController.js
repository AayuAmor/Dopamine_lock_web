const analyticsService = require('../services/analyticsService')

function handleAnalyticsError(error, res, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  console.error(fallbackMessage, error)
  return res.status(500).json({ message: fallbackMessage })
}

function endpoint(serviceMethod, responseKey, fallbackMessage) {
  return async (req, res) => {
    try {
      const data = await serviceMethod(req.user.id, req.query)
      return res.json({ [responseKey]: data })
    } catch (error) {
      return handleAnalyticsError(error, res, fallbackMessage)
    }
  }
}

module.exports = {
  consumption: endpoint(analyticsService.getConsumptionAnalytics, 'consumption', 'Unable to load consumption analytics'),
  dashboard: endpoint(analyticsService.getDashboard, 'dashboard', 'Unable to load dashboard analytics'),
  discipline: endpoint(analyticsService.getDisciplineAnalytics, 'discipline', 'Unable to load discipline analytics'),
  focus: endpoint(analyticsService.getFocusAnalytics, 'focus', 'Unable to load focus analytics'),
  missions: endpoint(analyticsService.getMissionAnalytics, 'missions', 'Unable to load mission analytics'),
  monthly: endpoint(analyticsService.getMonthly, 'monthly', 'Unable to load monthly analytics'),
  overview: endpoint(analyticsService.getOverview, 'overview', 'Unable to load overview analytics'),
  streak: endpoint(analyticsService.getStreakAnalytics, 'streak', 'Unable to load streak analytics'),
  weekly: endpoint(analyticsService.getWeekly, 'weekly', 'Unable to load weekly analytics'),
}
