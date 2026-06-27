import { useEffect, useState } from 'react'

export function useAnalytics(loader, params, initialValue = null) {
  const [data, setData] = useState(initialValue)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      setIsLoading(true)
      setError('')
      try {
        const result = await loader(params)
        if (active) setData(result)
      } catch (err) {
        if (active) setError(err.message || 'Unable to load analytics')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadAnalytics()

    return () => {
      active = false
    }
  }, [loader, JSON.stringify(params || {})])

  return { data, error, isLoading }
}
