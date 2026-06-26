import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getEffectiveRules,
  getPresets,
  getRules,
} from '../services/blockManagerService'

export function useBlockManager() {
  const [effectiveRules, setEffectiveRules] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [presets, setPresets] = useState([])
  const [rules, setRules] = useState([])

  const refreshBlockManager = useCallback(async () => {
    try {
      setError('')
      const [loadedRules, loadedPresets, loadedEffectiveRules] = await Promise.all([
        getRules(),
        getPresets(),
        getEffectiveRules(),
      ])
      setRules(loadedRules)
      setPresets(loadedPresets)
      setEffectiveRules(loadedEffectiveRules)
      return {
        effectiveRules: loadedEffectiveRules,
        presets: loadedPresets,
        rules: loadedRules,
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

    async function loadBlockManager() {
      try {
        const [loadedRules, loadedPresets, loadedEffectiveRules] = await Promise.all([
          getRules(),
          getPresets(),
          getEffectiveRules(),
        ])

        if (active) {
          setRules(loadedRules)
          setPresets(loadedPresets)
          setEffectiveRules(loadedEffectiveRules)
          setError('')
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadBlockManager()

    return () => {
      active = false
    }
  }, [])

  return useMemo(
    () => ({
      effectiveRules,
      error,
      isLoading,
      presets,
      refreshBlockManager,
      rules,
      setEffectiveRules,
      setPresets,
      setRules,
    }),
    [effectiveRules, error, isLoading, presets, refreshBlockManager, rules],
  )
}
