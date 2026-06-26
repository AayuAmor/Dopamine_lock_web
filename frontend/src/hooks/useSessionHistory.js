import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getHistory,
  getMonth,
  getSummary,
  getToday,
  getWeek,
} from '../services/sessionHistoryService'

function endpointForFilter(filter) {
  if (filter === 'Today') {
    return getToday
  }

  if (filter === 'This Week') {
    return getWeek
  }

  if (filter === 'This Month') {
    return getMonth
  }

  return getHistory
}

export function useSessionHistory(params = {}) {
  const [error, setError] = useState('')
  const [history, setHistory] = useState({
    items: [],
    limit: 10,
    page: 1,
    totalItems: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const serializedParams = JSON.stringify(params)

  const refreshHistory = useCallback(async () => {
    try {
      setError('')
      const parsedParams = JSON.parse(serializedParams)
      const endpoint = endpointForFilter(parsedParams.filter)
      const status = parsedParams.filter === 'Completed'
        ? 'COMPLETED'
        : parsedParams.filter === 'Abandoned'
          ? 'ABANDONED'
          : undefined
      const requestParams = {
        ...parsedParams,
        filter: undefined,
        status,
      }
      const [loadedHistory, loadedSummary] = await Promise.all([
        endpoint(requestParams),
        getSummary(),
      ])
      setHistory(loadedHistory)
      setSummary(loadedSummary)
      return { history: loadedHistory, summary: loadedSummary }
    } catch (loadError) {
      setError(loadError.message)
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [serializedParams])

  useEffect(() => {
    let active = true

    async function loadHistory() {
      try {
        const loaded = await refreshHistory()
        if (!active) {
          return
        }
        setHistory(loaded.history)
        setSummary(loaded.summary)
      } catch {
        // refreshHistory already stores the error for the page.
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      active = false
    }
  }, [refreshHistory])

  return useMemo(
    () => ({
      error,
      history,
      isLoading,
      refreshHistory,
      summary,
    }),
    [error, history, isLoading, refreshHistory, summary],
  )
}
