import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getIdentity,
  getProgression,
  getSummary,
  getTraits,
} from '../services/identityService'

export function useIdentity() {
  const [identity, setIdentity] = useState(null)
  const [traits, setTraits] = useState([])
  const [progression, setProgression] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshIdentity = useCallback(async () => {
    try {
      setError('')
      const [loadedIdentity, loadedTraits, loadedProgression, loadedSummary] = await Promise.all([
        getIdentity(),
        getTraits(),
        getProgression(),
        getSummary(),
      ])
      setIdentity(loadedIdentity)
      setTraits(loadedTraits)
      setProgression(loadedProgression)
      setSummary(loadedSummary)
      return loadedIdentity
    } catch (loadError) {
      setError(loadError.message)
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const [loadedIdentity, loadedTraits, loadedProgression, loadedSummary] = await Promise.all([
          getIdentity(),
          getTraits(),
          getProgression(),
          getSummary(),
        ])
        if (active) {
          setIdentity(loadedIdentity)
          setTraits(loadedTraits)
          setProgression(loadedProgression)
          setSummary(loadedSummary)
          setError('')
        }
      } catch (loadError) {
        if (active) setError(loadError.message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return useMemo(
    () => ({ error, identity, isLoading, progression, refreshIdentity, summary, traits }),
    [error, identity, isLoading, progression, refreshIdentity, summary, traits],
  )
}
