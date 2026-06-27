import { useCallback, useEffect, useMemo, useState } from "react";
import { getGoalSummary, getGoals } from "../services/goalService";

const defaultGoalParams = {};

export function useGoals(params = defaultGoalParams) {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshGoals = useCallback(async () => {
    try {
      setError("");
      const [loadedGoals, loadedSummary] = await Promise.all([
        getGoals(params),
        getGoalSummary(),
      ]);
      setGoals(loadedGoals);
      setSummary(loadedSummary);
      return loadedGoals;
    } catch (loadError) {
      setError(loadError.message);
      throw loadError;
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    let active = true;

    async function loadGoals() {
      setIsLoading(true);
      try {
        const [loadedGoals, loadedSummary] = await Promise.all([
          getGoals(params),
          getGoalSummary(),
        ]);
        if (active) {
          setGoals(loadedGoals);
          setSummary(loadedSummary);
          setError("");
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadGoals();

    return () => {
      active = false;
    };
  }, [params]);

  return useMemo(
    () => ({ error, goals, isLoading, refreshGoals, setGoals, summary }),
    [error, goals, isLoading, refreshGoals, summary],
  );
}
