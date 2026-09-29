// Shared stock-state classification — used by StatusPill, HomeScreen, InventoryScreen
// and ProductDetailScreen so "low stock" and "out of stock" mean the same thing everywhere.
export function getStockState(quantidade, minimo) {
  const qty = quantidade ?? 0;
  if (qty <= 0) return 'out';
  if (qty < (minimo ?? 0)) return 'low';
  return 'available';
}

export const STOCK_STATE_LABEL = {
  available: 'Disponível',
  low: 'Estoque baixo',
  out: 'Sem estoque',
};
