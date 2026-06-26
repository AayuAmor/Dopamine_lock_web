import { useCallback, useEffect, useMemo, useState } from 'react'
import { getToken } from '../services/apiClient'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/authService'
import {
  getProfile,
  updateProfile as saveProfile,
  uploadAvatar as uploadProfileAvatar,
} from '../services/profileService'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadUser() {
      if (!getToken()) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        if (active) {
          setUser(currentUser)
        }
      } catch {
        logoutUser()
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const loggedInUser = await loginUser(credentials)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload) => {
    const registeredUser = await registerUser(payload)
    setUser(registeredUser)
    return registeredUser
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await getProfile()
    setUser(profile)
    return profile
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const profile = await saveProfile(payload)
    setUser(profile)
    return profile
  }, [])

  const uploadAvatar = useCallback(async (file) => {
    const profile = await uploadProfileAvatar(file)
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      refreshProfile,
      updateProfile,
      uploadAvatar,
      logout,
    }),
    [isLoading, login, logout, refreshProfile, register, updateProfile, uploadAvatar, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
