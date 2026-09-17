import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useFetchEstoqueResumo = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResumo = async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getEstoqueResumo();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumo();
  }, []);

  return { data, isLoading, error };
};
