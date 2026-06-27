import { apiRequest } from './apiClient'

function withQuery(path, params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value)
    }
  })
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

export async function getDashboard(params) {
  const data = await apiRequest(withQuery('/analytics/dashboard', params))
  return data.dashboard
}

export async function getOverview(params) {
  const data = await apiRequest(withQuery('/analytics/overview', params))
  return data.overview
}

export async function getFocus(params) {
  const data = await apiRequest(withQuery('/analytics/focus', params))
  return data.focus
}

export async function getMissionAnalytics(params) {
  const data = await apiRequest(withQuery('/analytics/missions', params))
  return data.missions
}

export async function getConsumptionAnalytics(params) {
  const data = await apiRequest(withQuery('/analytics/consumption', params))
  return data.consumption
}

export async function getDisciplineAnalytics(params) {
  const data = await apiRequest(withQuery('/analytics/discipline', params))
  return data.discipline
}

export async function getStreakAnalytics(params) {
  const data = await apiRequest(withQuery('/analytics/streak', params))
  return data.streak
}

export async function getWeekly(params) {
  const data = await apiRequest(withQuery('/analytics/weekly', params))
  return data.weekly
}

export async function getMonthly(params) {
  const data = await apiRequest(withQuery('/analytics/monthly', params))
  return data.monthly
}
