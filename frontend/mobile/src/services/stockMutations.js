import NetInfo from '@react-native-community/netinfo';
import apiService from './api';
import { enqueue } from './offlineQueue';

async function isOnline() {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

function snapshot(produto) {
  return { id: produto.id, nome: produto.nome, sku: produto.sku, quantidadeTotal: produto.quantidadeTotal };
}

// Both wrappers return { queued: true } when offline (the caller shows a
// "será sincronizado" message instead of the normal success toast) or
// { queued: false, result } when the call went straight to the API.
export async function submitStockEntry(payload, produto) {
  if (!(await isOnline())) {
    await enqueue({ type: 'ENTRADA', payload, productSnapshot: snapshot(produto) });
    return { queued: true };
  }
  const result = await apiService.createStockEntry(payload);
  return { queued: false, result };
}

export async function submitStockWithdrawal(payload, produto) {
  if (!(await isOnline())) {
    await enqueue({ type: 'SAIDA', payload, productSnapshot: snapshot(produto) });
    return { queued: true };
  }
  const result = await apiService.withdrawStockFIFO(payload);
  return { queued: false, result };
}
