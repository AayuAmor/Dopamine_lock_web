import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAchievements, getAchievementSummary } from '../services/achievementService'

export function useAchievements() {
  const [achievements, setAchievements] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshAchievements = useCallback(async () => {
    try {
      setError('')
      const [loadedAchievements, loadedSummary] = await Promise.all([
        getAchievements(),
        getAchievementSummary(),
      ])
      setAchievements(loadedAchievements)
      setSummary(loadedSummary)
      return loadedAchievements
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
        const [loadedAchievements, loadedSummary] = await Promise.all([
          getAchievements(),
          getAchievementSummary(),
        ])
        if (active) {
          setAchievements(loadedAchievements)
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
    return () => { active = false }
  }, [])

  return useMemo(
    () => ({ achievements, error, isLoading, refreshAchievements, summary }),
    [achievements, error, isLoading, refreshAchievements, summary],
  )
}
