import { apiRequest } from './apiClient'

export async function getRules() {
  const data = await apiRequest('/block-manager/rules')
  return data.rules
}

export async function getRule(id) {
  const data = await apiRequest(`/block-manager/rules/${id}`)
  return data.rule
}

export async function createRule(payload) {
  const data = await apiRequest('/block-manager/rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.rule
}

export async function updateRule(id, payload) {
  const data = await apiRequest(`/block-manager/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.rule
}

export async function deleteRule(id) {
  const data = await apiRequest(`/block-manager/rules/${id}`, {
    method: 'DELETE',
  })
  return data.rule
}

export async function toggleRule(id) {
  const data = await apiRequest(`/block-manager/rules/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  })
  return data.rule
}

export async function getPresets() {
  const data = await apiRequest('/block-manager/presets')
  return data.presets
}

export async function enablePreset(id) {
  const data = await apiRequest(`/block-manager/presets/${id}/enable`, {
    method: 'POST',
  })
  return data.preset
}

export async function disablePreset(id) {
  const data = await apiRequest(`/block-manager/presets/${id}/disable`, {
    method: 'POST',
  })
  return data.preset
}

export async function getEffectiveRules() {
  const data = await apiRequest('/block-manager/effective-rules')
  return data.rules
}
