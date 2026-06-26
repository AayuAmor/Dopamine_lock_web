import { useEffect, useMemo, useState } from 'react'
import { getToken } from '../services/apiClient'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/authService'
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

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      async login(credentials) {
        const loggedInUser = await loginUser(credentials)
        setUser(loggedInUser)
        return loggedInUser
      },
      async register(payload) {
        const registeredUser = await registerUser(payload)
        setUser(registeredUser)
        return registeredUser
      },
      logout() {
        logoutUser()
        setUser(null)
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
