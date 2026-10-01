import { useState, useEffect } from 'react';
import apiService from '../services/api';

// Entradas and saídas of the last `dias` days, for the dashboard's Movimentações chart.
export const useFetchMovimentacoes = (dias = 45) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      apiService.getMovimentacoes({ dias, tipo: 'ENTRADA' }),
      apiService.getMovimentacoes({ dias, tipo: 'SAIDA' }),
    ])
      .then(([entradas, saidas]) => {
        if (cancelled) return;
        setData({ entradas, saidas });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setData(null);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dias]);

  return { data, isLoading, error };
};
