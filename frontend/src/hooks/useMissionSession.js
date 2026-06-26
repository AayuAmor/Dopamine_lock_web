import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentSession } from '../services/missionSessionService'

export function useMissionSession() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshSession = useCallback(async () => {
    try {
      setError('')
      const currentSession = await getCurrentSession()
      setSession(currentSession)
      return currentSession
    } catch (loadError) {
      setError(loadError.message)
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession()
        if (active) {
          setSession(currentSession)
          setError('')
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      active = false
    }
  }, [])

  return useMemo(
    () => ({
      error,
      isLoading,
      refreshSession,
      session,
      setSession,
    }),
    [error, isLoading, refreshSession, session],
  )
}
