const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'
const TOKEN_KEY = 'dopamine_lock_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAssetUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) {
    return path
  }

  try {
    return `${new URL(API_BASE_URL).origin}${path}`
  } catch {
    return path
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}
