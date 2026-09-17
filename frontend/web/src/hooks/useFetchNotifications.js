import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export const useFetchNotifications = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const result = await apiService.getNotifications(JSON.parse(paramsKey));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, isLoading, error, refetch };
};