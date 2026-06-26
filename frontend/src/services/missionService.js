import { apiRequest } from './apiClient'

export async function getAllMissions() {
  const data = await apiRequest('/missions')
  return data.missions
}

export async function getMission(id) {
  const data = await apiRequest(`/missions/${id}`)
  return data.mission
}

export async function createMission(payload) {
  const data = await apiRequest('/missions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.mission
}

export async function updateMission(id, payload) {
  const data = await apiRequest(`/missions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.mission
}

export async function archiveMission(id, archived = true) {
  const data = await apiRequest(`/missions/${id}/archive`, {
    method: 'PATCH',
    body: JSON.stringify({ archived }),
  })
  return data.mission
}

export async function toggleFavorite(id) {
  const data = await apiRequest(`/missions/${id}/favorite`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  })
  return data.mission
}

export async function deleteMission(id) {
  const data = await apiRequest(`/missions/${id}`, {
    method: 'DELETE',
  })
  return data.mission
}
