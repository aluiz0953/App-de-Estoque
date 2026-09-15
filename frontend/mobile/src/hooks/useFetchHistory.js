import { useState, useEffect } from 'react';
import apiService from '../services/api';

const useFetchHistory = (filter = 'all') => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // Em uma implementação real, você teria um endpoint específico para histórico
        // Por enquanto, vamos simular com dados vazios ou de um endpoint genérico
        setData([]); // Placeholder - implementar conforme sua API
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [filter]);

  return { data, isLoading, error };
};

export default useFetchHistory;