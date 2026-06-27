import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDashboard } from '../services/dashboardService'

export function useDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const refreshDashboard = useCallback(async () => {
    try {
      setError('')
      const data = await getDashboard()
      setDashboard(data)
      return data
    } catch (loadError) {
      setError(loadError.message || 'Unable to load dashboard')
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setIsLoading(true)
      setError('')
      try {
        const data = await getDashboard()
        if (active) setDashboard(data)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load dashboard')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  return useMemo(
    () => ({ dashboard, error, isLoading, refreshDashboard }),
    [dashboard, error, isLoading, refreshDashboard],
  )
}
