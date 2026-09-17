import NetInfo from '@react-native-community/netinfo';
import apiService from './api';
import { getQueue, removeFromQueue, markConflict } from './offlineQueue';

// Tiny pub/sub so screens can react to queue changes without polling.
const listeners = new Set();
function notify() {
  listeners.forEach((fn) => fn());
}
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let syncing = false;
export function isSyncing() {
  return syncing;
}

// "Block and ask": a conflicted action is never retried or discarded
// automatically — it sits in the queue tagged 'conflict' until the user
// reviews it (see SettingsScreen's Sincronização section).
export async function flushQueue() {
  if (syncing) return;
  syncing = true;
  notify();
  try {
    const queue = await getQueue();
    for (const action of queue) {
      if (action.status === 'conflict') continue;
      try {
        if (action.type === 'ENTRADA') {
          await apiService.createStockEntry(action.payload);
          await removeFromQueue(action.id);
        } else if (action.type === 'SAIDA') {
          const result = await apiService.withdrawStockFIFO(action.payload);
          if (result.sucesso) {
            await removeFromQueue(action.id);
          } else {
            await markConflict(action.id, result.mensagem || 'Estoque insuficiente');
          }
        }
      } catch (e) {
        await markConflict(action.id, e.message || 'Falha ao sincronizar');
      }
      notify();
    }
  } finally {
    syncing = false;
    notify();
  }
}

let started = false;
export function startSyncManager() {
  if (started) return;
  started = true;
  NetInfo.addEventListener((state) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (online) flushQueue();
  });
}
