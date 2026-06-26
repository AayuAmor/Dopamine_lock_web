import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getCalendarMonth,
  getMilestones,
  getStreakSummary,
  getWeeklyConsistency,
} from '../services/streakService'

export function useStreak(month, year) {
  const [calendar, setCalendar] = useState({ days: [], month, year })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [milestones, setMilestones] = useState([])
  const [summary, setSummary] = useState(null)
  const [weekly, setWeekly] = useState(null)

  const refreshStreak = useCallback(async () => {
    try {
      setError('')
      const [loadedSummary, loadedCalendar, loadedWeekly, loadedMilestones] = await Promise.all([
        getStreakSummary(),
        getCalendarMonth(month, year),
        getWeeklyConsistency(),
        getMilestones(),
      ])
      setSummary(loadedSummary)
      setCalendar(loadedCalendar)
      setWeekly(loadedWeekly)
      setMilestones(loadedMilestones)
      return {
        calendar: loadedCalendar,
        milestones: loadedMilestones,
        summary: loadedSummary,
        weekly: loadedWeekly,
      }
    } catch (loadError) {
      setError(loadError.message)
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    let active = true

    async function loadStreak() {
      try {
        const loaded = await refreshStreak()
        if (!active) {
          return
        }
        setSummary(loaded.summary)
        setCalendar(loaded.calendar)
        setWeekly(loaded.weekly)
        setMilestones(loaded.milestones)
      } catch {
        // refreshStreak stores the error.
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadStreak()

    return () => {
      active = false
    }
  }, [refreshStreak])

  return useMemo(
    () => ({
      calendar,
      error,
      isLoading,
      milestones,
      refreshStreak,
      summary,
      weekly,
    }),
    [calendar, error, isLoading, milestones, refreshStreak, summary, weekly],
  )
}
