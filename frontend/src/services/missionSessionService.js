import { apiRequest } from './apiClient'

export async function getCurrentSession() {
  const data = await apiRequest('/mission-session/current')
  return data.session
}

export async function startMission(missionId) {
  const data = await apiRequest(`/mission-session/start/${missionId}`, {
    method: 'POST',
  })
  return data.session
}

export async function pauseMission() {
  const data = await apiRequest('/mission-session/pause', {
    method: 'POST',
  })
  return data.session
}

export async function resumeMission() {
  const data = await apiRequest('/mission-session/resume', {
    method: 'POST',
  })
  return data.session
}

export async function completeMission(notes) {
  const data = await apiRequest('/mission-session/complete', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  })
  return data.session
}

export async function abandonMission(notes) {
  const data = await apiRequest('/mission-session/abandon', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  })
  return data.session
}

export async function history() {
  const data = await apiRequest('/mission-session/history')
  return data.sessions
}
