import { apiRequest } from './apiClient'

function withQuery(path, params = {}) {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

export async function getCurrentReview(params = {}) {
  const data = await apiRequest(withQuery('/reviews/weekly', params))
  return data.review
}

export async function getHistory() {
  const data = await apiRequest('/reviews/weekly/history')
  return data.history
}

export async function getWeekReview(weekStart) {
  const data = await apiRequest(`/reviews/weekly/${weekStart}`)
  return data.review
}

export async function generate(params = {}) {
  const data = await apiRequest(withQuery('/reviews/weekly/generate', params), { method: 'POST' })
  return data.review
}
