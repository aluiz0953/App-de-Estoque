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

// A timed-out/unreachable-server fetch surfaces as a plain TypeError (or our
// own "Tempo de conexão esgotado" message from the abort handler in api.js) —
// that's the backend being unreachable, not the backend rejecting the action,
// so it must not be treated the same as a real business conflict below. A 401
// belongs in the same bucket: it means the session died (backend redeploy —
// sessions are in-memory), not that this specific action was rejected. api.js
// already forces a logout on 401 (see App.js's onUnauthorized), so the action
// just needs to survive as 'pending' for when the user logs back in.
function isTransientNetworkError(err) {
  return err.name === 'TypeError' || err.status === 401 || /Tempo de conexão esgotado/.test(err.message || '');
}

// "Block and ask": a conflicted action is never retried or discarded
// automatically — it sits in the queue tagged 'conflict' until the user
// reviews it (see SettingsScreen's Sincronização section). A conflict is a
// business-rule rejection (e.g. insufficient stock); a network failure just
// means "try again later" and must leave the action 'pending', or every
// action queued during an outage gets stuck needing manual review forever
// even after connectivity comes back.
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
        if (isTransientNetworkError(e)) {
          // Backend still unreachable - stop this cycle instead of burning
          // the request timeout on every remaining item; they stay 'pending'
          // for the next trigger.
          break;
        }
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
  // Flush immediately on launch too - otherwise a queue built up while the
  // app was closed only drains on the next online/offline transition, which
  // may never come if Wi-Fi was connected the whole time (only the backend
  // was unreachable).
  flushQueue();
  NetInfo.addEventListener((state) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (online) flushQueue();
  });
}
