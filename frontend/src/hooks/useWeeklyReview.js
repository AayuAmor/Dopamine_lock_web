import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentReview, getHistory } from '../services/weeklyReviewService'

const defaultParams = {}

export function useWeeklyReview(params = defaultParams) {
  const [review, setReview] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshReview = useCallback(async () => {
    try {
      setError('')
      const [loadedReview, loadedHistory] = await Promise.all([
        getCurrentReview(params),
        getHistory(),
      ])
      setReview(loadedReview)
      setHistory(loadedHistory)
      return loadedReview
    } catch (loadError) {
      setError(loadError.message)
      throw loadError
    } finally {
      setIsLoading(false)
    }
  }, [params])

  useEffect(() => {
    let active = true
    async function load() {
      setIsLoading(true)
      try {
        const [loadedReview, loadedHistory] = await Promise.all([
          getCurrentReview(params),
          getHistory(),
        ])
        if (active) {
          setReview(loadedReview)
          setHistory(loadedHistory)
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
  }, [params])

  return useMemo(
    () => ({ error, history, isLoading, refreshReview, review }),
    [error, history, isLoading, refreshReview, review],
  )
}
