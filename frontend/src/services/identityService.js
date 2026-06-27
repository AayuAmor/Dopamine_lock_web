import { apiRequest } from './apiClient'

export async function getIdentity() {
  const data = await apiRequest('/identity')
  return data.identity
}

export async function getTraits() {
  const data = await apiRequest('/identity/traits')
  return data.traits
}

export async function getProgression() {
  const data = await apiRequest('/identity/progression')
  return data.progression
}

export async function getSummary() {
  const data = await apiRequest('/identity/summary')
  return data.summary
}

export async function recalculate() {
  const data = await apiRequest('/identity/recalculate', { method: 'POST' })
  return data.identity
}
