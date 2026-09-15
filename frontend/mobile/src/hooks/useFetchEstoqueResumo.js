import { useState, useEffect } from 'react';
import apiService from '../services/api';

const useFetchEstoqueResumo = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstoqueResumo = async () => {
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

    fetchEstoqueResumo();
  }, []);

  return { data, isLoading, error };
};

export default useFetchEstoqueResumo;