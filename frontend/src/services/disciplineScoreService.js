import { apiRequest } from './apiClient'

export async function getDisciplineScore() {
  const data = await apiRequest('/discipline-score')
  return data.score
}

export async function getScoreBreakdown() {
  const data = await apiRequest('/discipline-score/breakdown')
  return data.breakdown || []
}

export async function getScoreTrend() {
  const data = await apiRequest('/discipline-score/trend')
  return data.trend || []
}

export async function getScoreEvents() {
  const data = await apiRequest('/discipline-score/events')
  return data.events || []
}

export async function recalculateScore() {
  const data = await apiRequest('/discipline-score/recalculate', {
    method: 'POST',
  })
  return data.score
}
