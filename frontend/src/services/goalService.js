import { apiRequest } from './apiClient'

function buildQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getGoals(params = {}) {
  const data = await apiRequest(`/goals${buildQuery(params)}`)
  return data.goals
}

export async function getGoal(id) {
  const data = await apiRequest(`/goals/${id}`)
  return data.goal
}

export async function createGoal(payload) {
  const data = await apiRequest('/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.goal
}

export async function updateGoal(id, payload) {
  const data = await apiRequest(`/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.goal
}

export async function updateGoalProgress(id, payload) {
  const data = await apiRequest(`/goals/${id}/progress`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.goal
}

export async function completeGoal(id) {
  const data = await apiRequest(`/goals/${id}/complete`, { method: 'PATCH' })
  return data.goal
}

export async function pauseGoal(id) {
  const data = await apiRequest(`/goals/${id}/pause`, { method: 'PATCH' })
  return data.goal
}

export async function resumeGoal(id) {
  const data = await apiRequest(`/goals/${id}/resume`, { method: 'PATCH' })
  return data.goal
}

export async function archiveGoal(id) {
  const data = await apiRequest(`/goals/${id}`, { method: 'DELETE' })
  return data.goal
}

export async function connectMission(goalId, missionId) {
  const data = await apiRequest(`/goals/${goalId}/missions/${missionId}`, { method: 'POST' })
  return data.goal
}

export async function removeMission(goalId, missionId) {
  const data = await apiRequest(`/goals/${goalId}/missions/${missionId}`, { method: 'DELETE' })
  return data.goal
}

export async function getGoalSummary() {
  const data = await apiRequest('/goals/summary')
  return data.summary
}
