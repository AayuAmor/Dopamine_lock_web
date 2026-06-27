import { apiRequest } from './apiClient'

export async function getAchievements() {
  const data = await apiRequest('/achievements')
  return data.achievements
}

export async function getUnlocked() {
  const data = await apiRequest('/achievements/unlocked')
  return data.achievements
}

export async function getLocked() {
  const data = await apiRequest('/achievements/locked')
  return data.achievements
}

export async function getAchievementSummary() {
  const data = await apiRequest('/achievements/summary')
  return data.summary
}

export async function getAchievement(id) {
  const data = await apiRequest(`/achievements/${id}`)
  return data.achievement
}

export async function recalculate() {
  const data = await apiRequest('/achievements/recalculate', { method: 'POST' })
  return data
}
