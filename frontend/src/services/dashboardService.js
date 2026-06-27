import { apiRequest } from './apiClient'

export async function getDashboard() {
  const data = await apiRequest('/dashboard')
  return data.dashboard
}
