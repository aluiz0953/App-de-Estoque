import { useState, useEffect } from 'react';
import apiService from '../services/api';

const useFetchProductLotes = (productId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchLotes = async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getProductLotes(productId);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLotes();
  }, [productId]);

  return { data, isLoading, error };
};

export default useFetchProductLotes;