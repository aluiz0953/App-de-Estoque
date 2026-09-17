import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const useFetchProducts = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiService.getProducts(params);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, isLoading, error, refetch: fetchProducts };
};

export default useFetchProducts;
