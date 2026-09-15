import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useFetchNotifications = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getNotifications(params);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [params]);

  return { data, isLoading, error };
};