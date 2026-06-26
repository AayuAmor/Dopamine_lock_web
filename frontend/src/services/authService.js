import { apiRequest, clearToken, setToken } from './apiClient'

export async function registerUser(payload) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(data.token)
  return data.user
}

export async function loginUser(payload) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(data.token)
  return data.user
}

export async function getCurrentUser() {
  const data = await apiRequest('/auth/me')
  return data.user
}

export function logoutUser() {
  clearToken()
}
