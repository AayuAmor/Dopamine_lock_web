import { apiRequest } from './apiClient'

export async function getProfile() {
  const data = await apiRequest('/profile')
  return data.profile
}

export async function updateProfile(payload) {
  const data = await apiRequest('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.profile
}

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const data = await apiRequest('/profile/avatar', {
    method: 'POST',
    body: formData,
  })

  return data.profile
}
