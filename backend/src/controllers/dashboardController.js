const { getDashboard } = require('../services/dashboardService')

async function dashboard(req, res) {
  try {
    const data = await getDashboard(req.user.id)
    return res.json({ dashboard: data })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message })
    }

    console.error('Unable to load dashboard', error)
    return res.status(500).json({ message: 'Unable to load dashboard' })
  }
}

module.exports = {
  dashboard,
}
