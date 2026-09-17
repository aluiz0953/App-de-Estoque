import { useCallback, useEffect, useState } from 'react';
import apiService from '../services/api';

const PAGE_SIZE = 20;

// filters: { tipo, produtoId, usuarioId, motivo, dataInicio, dataFim }
const useFetchHistory = (filters = {}) => {
  const filterKey = JSON.stringify(filters);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (targetPage, append) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const result = await apiService.getMovimentacoesHistorico({
          ...filters,
          page: targetPage,
          size: PAGE_SIZE,
        });
        setData((prev) => (append ? [...prev, ...(result.content || [])] : result.content || []));
        setTotalPages(result.totalPages ?? 1);
        setPage(targetPage);
        setError(null);
      } catch (err) {
        setError(err);
        if (!append) setData([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey]
  );

  useEffect(() => {
    load(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadMore = () => {
    if (!isLoading && !isLoadingMore && page + 1 < totalPages) load(page + 1, true);
  };

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    hasMore: page + 1 < totalPages,
    refetch: () => load(0, false),
  };
};

export default useFetchHistory;
