import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getIdentityConsumption,
  getLimits,
  getLogs,
  getPlatforms,
  getSummary,
  getTimeline,
  getWeeklyAnalytics,
} from '../services/consumptionService'

export function useConsumption() {
  const [error, setError] = useState('')
  const [identity, setIdentity] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [limits, setLimits] = useState(null)
  const [logs, setLogs] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [summary, setSummary] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [weekly, setWeekly] = useState(null)

  const refreshConsumption = useCallback(async () => {
    try {
      setError('')
      const [
        loadedSummary,
        loadedPlatforms,
        loadedLimits,
        loadedLogs,
        loadedTimeline,
        loadedWeekly,
        loadedIdentity,
      ] = await Promise.all([
        getSummary(),
        getPlatforms(),
        getLimits(),
        getLogs(),
        getTimeline(),
        getWeeklyAnalytics(),
        getIdentityConsumption(),
      ])

      setSummary(loadedSummary)
      setPlatforms(loadedPlatforms)
      setLimits(loadedLimits)
      setLogs(loadedLogs)
      setTimeline(loadedTimeline)
      setWeekly(loadedWeekly)
      setIdentity(loadedIdentity)

      return {
        identity: loadedIdentity,
        limits: loadedLimits,
        logs: loadedLogs,
        platforms: loadedPlatforms,
        summary: loadedSummary,
        timeline: loadedTimeline,
        weekly: loadedWeekly,
      }
    } catch (loadError) {
      setError(loadError.message)
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadConsumption() {
      try {
        const loaded = await refreshConsumption()
        if (!active) {
          return
        }
        setSummary(loaded.summary)
        setPlatforms(loaded.platforms)
        setLimits(loaded.limits)
        setLogs(loaded.logs)
        setTimeline(loaded.timeline)
        setWeekly(loaded.weekly)
        setIdentity(loaded.identity)
      } catch {
        // refreshConsumption stores the visible error.
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadConsumption()

    return () => {
      active = false
    }
  }, [refreshConsumption])

  return useMemo(
    () => ({
      error,
      identity,
      isLoading,
      limits,
      logs,
      platforms,
      refreshConsumption,
      summary,
      timeline,
      weekly,
    }),
    [error, identity, isLoading, limits, logs, platforms, refreshConsumption, summary, timeline, weekly],
  )
}
