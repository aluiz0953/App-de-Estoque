import { useState, useEffect, useCallback, useRef } from 'react';
import apiService, { onUnauthorized } from '../services/api';

// Stale-while-revalidate: the last result for each query is kept in memory so
// coming back to the screen (or repeating a search) paints instantly, while a
// fresh request always runs in the background and replaces it - stock numbers
// are never trusted from the cache alone.
const MAX_CACHED_QUERIES = 20;
const cache = new Map();
onUnauthorized(() => cache.clear());

function remember(key, value) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > MAX_CACHED_QUERIES) cache.delete(cache.keys().next().value);
}

const useFetchProducts = (params = {}) => {
  const key = JSON.stringify(params);
  const cached = cache.get(key);
  const [data, setData] = useState(cached ?? null);
  const [isLoading, setIsLoading] = useState(cached === undefined);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(cached !== undefined);

  const fetchProducts = useCallback(async () => {
    const hit = cache.get(key);
    if (hit !== undefined) {
      setData(hit);
      setIsLoading(false);
    } else if (!hasLoadedOnce.current) {
      // Only block the screen on the very first load - a refetch (search term
      // change, pull-to-refresh, post-mutation reload) keeps showing the last
      // data instead of flashing a full-screen spinner every time.
      setIsLoading(true);
    }
    try {
      const result = await apiService.getProducts(params);
      remember(key, result);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Optimistic updates: apply `updater` to the list now (and to the cache) without
  // waiting for the server; the caller reverts by calling mutate(() => previous).
  const mutate = useCallback(
    (updater) => {
      setData((previous) => {
        const next = updater(previous);
        if (next) remember(key, next);
        return next;
      });
    },
    [key]
  );

  return { data, isLoading, error, refetch: fetchProducts, mutate };
};

export default useFetchProducts;
