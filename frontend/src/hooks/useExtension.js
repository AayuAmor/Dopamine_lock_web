import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSyncState } from '../services/extensionService'

export function useExtension() {
  const [syncState, setSyncState] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const refreshExtension = useCallback(async () => {
    try {
      setError('')
      const state = await getSyncState()
      setSyncState(state)
      return state
    } catch (loadError) {
      setError(loadError.message || 'Unable to load extension state')
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadExtension() {
      setIsLoading(true)
      setError('')
      try {
        const state = await getSyncState()
        if (active) setSyncState(state)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load extension state')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadExtension()

    return () => {
      active = false
    }
  }, [])

  return useMemo(
    () => ({ error, isLoading, refreshExtension, syncState }),
    [error, isLoading, refreshExtension, syncState],
  )
}
