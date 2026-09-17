import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useFetchMovimentacoes = (dias = 45) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovimentacoes = async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getMovimentacoes({ dias, tipo: 'SAIDA' });
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovimentacoes();
  }, [dias]);

  return { data, isLoading, error };
};
