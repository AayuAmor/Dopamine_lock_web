import { apiRequest } from './apiClient'

export async function getSyncState() {
  const data = await apiRequest('/extension/sync')
  return data.sync
}

export async function getMissionState() {
  const data = await apiRequest('/extension/mission-state')
  return data.missionState
}

export async function getEffectiveRules() {
  const data = await apiRequest('/extension/effective-rules')
  return data.rules
}

export async function getConsumptionState() {
  const data = await apiRequest('/extension/consumption-state')
  return data.consumptionState
}

export async function reportBlockAttempt(payload) {
  const data = await apiRequest('/extension/block-attempt', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
  return data.attempt
}

export async function reportConsumptionEvent(payload) {
  const data = await apiRequest('/extension/consumption-event', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
  return data.log
}

export async function updateExtensionStatus(payload) {
  const data = await apiRequest('/extension/status', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
  return data.status
}

export async function getExtensionStatus() {
  const data = await apiRequest('/extension/status')
  return data.status
}
