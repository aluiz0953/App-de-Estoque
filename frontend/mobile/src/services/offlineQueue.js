import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_queue_v1';

// Each entry: { id, type: 'ENTRADA'|'SAIDA', payload, productSnapshot, createdAt,
// status: 'pending'|'conflict', conflictReason? }
export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(action) {
  const queue = await getQueue();
  const entry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...action,
  };
  queue.push(entry);
  await saveQueue(queue);
  return entry;
}

export async function removeFromQueue(id) {
  const queue = await getQueue();
  await saveQueue(queue.filter((a) => a.id !== id));
}

export async function markConflict(id, reason) {
  const queue = await getQueue();
  await saveQueue(queue.map((a) => (a.id === id ? { ...a, status: 'conflict', conflictReason: reason } : a)));
}

export async function markPending(id) {
  const queue = await getQueue();
  await saveQueue(queue.map((a) => (a.id === id ? { ...a, status: 'pending', conflictReason: undefined } : a)));
}
