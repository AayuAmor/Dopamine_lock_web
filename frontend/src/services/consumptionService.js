import { apiRequest } from './apiClient'

export async function getSummary() {
  const data = await apiRequest('/consumption/summary')
  return data.summary
}

export async function getPlatforms() {
  const data = await apiRequest('/consumption/platforms')
  return data.platforms || []
}

export async function getLimits() {
  const data = await apiRequest('/consumption/limits')
  return data.limits
}

export async function updateLimits(payload) {
  const data = await apiRequest('/consumption/limits', {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
  return data.limits
}

export async function getLogs() {
  const data = await apiRequest('/consumption/logs')
  return data.logs || []
}

export async function createLog(payload) {
  const data = await apiRequest('/consumption/logs', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
  return data.log
}

export async function deleteLog(id) {
  await apiRequest(`/consumption/logs/${id}`, {
    method: 'DELETE',
  })
}

export async function getTimeline() {
  const data = await apiRequest('/consumption/timeline')
  return data.timeline || []
}

export async function getWeeklyAnalytics() {
  const data = await apiRequest('/consumption/weekly')
  return data.weekly
}

export async function getIdentityConsumption() {
  const data = await apiRequest('/consumption/identity')
  return data.identity
}
