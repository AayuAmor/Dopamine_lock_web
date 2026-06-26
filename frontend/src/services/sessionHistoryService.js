import { apiRequest } from './apiClient'

function queryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function getHistory(params) {
  return apiRequest(`/session-history${queryString(params)}`)
}

export async function getSession(id) {
  const data = await apiRequest(`/session-history/${id}`)
  return data.session
}

export async function getSummary() {
  const data = await apiRequest('/session-history/summary')
  return data.summary
}

export async function getToday(params) {
  return apiRequest(`/session-history/today${queryString(params)}`)
}

export async function getWeek(params) {
  return apiRequest(`/session-history/week${queryString(params)}`)
}

export async function getMonth(params) {
  return apiRequest(`/session-history/month${queryString(params)}`)
}
