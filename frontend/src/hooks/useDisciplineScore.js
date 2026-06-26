import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getDisciplineScore,
  getScoreBreakdown,
  getScoreEvents,
  getScoreTrend,
} from '../services/disciplineScoreService'

export function useDisciplineScore() {
  const [breakdown, setBreakdown] = useState([])
  const [error, setError] = useState('')
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [score, setScore] = useState(null)
  const [trend, setTrend] = useState([])

  const refreshScore = useCallback(async () => {
    try {
      setError('')
      const [loadedScore, loadedBreakdown, loadedTrend, loadedEvents] = await Promise.all([
        getDisciplineScore(),
        getScoreBreakdown(),
        getScoreTrend(),
        getScoreEvents(),
      ])
      setScore(loadedScore)
      setBreakdown(loadedBreakdown)
      setTrend(loadedTrend)
      setEvents(loadedEvents)

      return {
        breakdown: loadedBreakdown,
        events: loadedEvents,
        score: loadedScore,
        trend: loadedTrend,
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

    async function loadScore() {
      try {
        const loaded = await refreshScore()
        if (!active) {
          return
        }
        setScore(loaded.score)
        setBreakdown(loaded.breakdown)
        setTrend(loaded.trend)
        setEvents(loaded.events)
      } catch {
        // refreshScore stores the visible error message.
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadScore()

    return () => {
      active = false
    }
  }, [refreshScore])

  return useMemo(
    () => ({
      breakdown,
      error,
      events,
      isLoading,
      refreshScore,
      score,
      trend,
    }),
    [breakdown, error, events, isLoading, refreshScore, score, trend],
  )
}
