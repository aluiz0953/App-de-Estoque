import { useState, useEffect } from 'react';
import apiService from '../services/api';

// Entradas and saídas of the last `dias` days for the dashboard's Movimentações chart.
// Keeps the previous result on screen while a new period loads (no spinner flash).
const useFetchMovimentacoes = (dias = 30) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled) setError(err);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dias]);

  return { data, isLoading, error };
};

export default useFetchMovimentacoes;
