import { useCallback, useEffect, useState } from 'react';
import { getQueue } from '../services/offlineQueue';
import { subscribe, isSyncing, flushQueue } from '../services/syncManager';

export function useSyncQueue() {
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setQueue(await getQueue());
    setSyncing(isSyncing());
  }, []);

  useEffect(() => {
    refresh();
    return subscribe(refresh);
  }, [refresh]);

  return {
    queue,
    pending: queue.filter((a) => a.status === 'pending'),
    conflicts: queue.filter((a) => a.status === 'conflict'),
    syncing,
    refresh,
    retrySync: flushQueue,
  };
}

export default useSyncQueue;
