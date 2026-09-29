import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';

const useFetchProducts = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  const fetchProducts = useCallback(async () => {
    // Only block the screen on the very first load - a refetch (search term
    // change, pull-to-refresh, post-mutation reload) keeps showing the last
    // data instead of flashing a full-screen spinner every time.
    if (!hasLoadedOnce.current) setIsLoading(true);
    try {
      const result = await apiService.getProducts(params);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, isLoading, error, refetch: fetchProducts };
};

export default useFetchProducts;
