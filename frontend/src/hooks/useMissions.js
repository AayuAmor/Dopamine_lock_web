import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllMissions } from '../services/missionService'

export function useMissions() {
  const [missions, setMissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshMissions = useCallback(async () => {
    try {
      setError('')
      const loadedMissions = await getAllMissions()
      setMissions(loadedMissions)
      return loadedMissions
    } catch (loadError) {
      setError(loadError.message)
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadMissions() {
      try {
        const loadedMissions = await getAllMissions()
        if (active) {
          setMissions(loadedMissions)
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

    loadMissions()

    return () => {
      active = false
    }
  }, [])

  return useMemo(
    () => ({
      error,
      isLoading,
      missions,
      refreshMissions,
      setMissions,
    }),
    [error, isLoading, missions, refreshMissions],
  )
}
