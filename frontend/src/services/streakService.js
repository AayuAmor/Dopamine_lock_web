import { apiRequest } from './apiClient'

export async function getStreakSummary() {
  const data = await apiRequest('/streak/summary')
  return data.streak
}

export async function getCalendarMonth(month, year) {
  const data = await apiRequest(`/streak/calendar?month=${month}&year=${year}`)
  return data.calendar
}

export async function getWeeklyConsistency() {
  const data = await apiRequest('/streak/weekly')
  return data.week
}

export async function getMilestones() {
  const data = await apiRequest('/streak/milestones')
  return data.milestones
}
