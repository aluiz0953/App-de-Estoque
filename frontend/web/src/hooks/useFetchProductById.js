import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useFetchProductById = (id) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getProductById(id);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { data, isLoading, error };
};
