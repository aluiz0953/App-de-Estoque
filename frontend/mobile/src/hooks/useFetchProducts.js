import { useState, useEffect } from 'react';
import apiService from '../services/api';

const useFetchProducts = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
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
    };

    fetchProducts();
  }, [params]);

  return { data, isLoading, error };
};

export default useFetchProducts;