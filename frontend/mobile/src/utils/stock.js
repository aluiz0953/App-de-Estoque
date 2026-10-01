// Shared stock-state classification — used by StatusPill, HomeScreen, InventoryScreen
// and ProductDetailScreen so "low stock" and "out of stock" mean the same thing everywhere.
export function getStockState(quantidade, minimo) {
  const qty = quantidade ?? 0;
  if (qty <= 0) return 'out';
  if (qty < (minimo ?? 0)) return 'low';
  return 'available';
}

// Filter chips of the Estoque tab (the Hoje cards link to them). "inStock" = anything with units,
// low-stock items included.
export const STOCK_FILTERS = [
  { value: 'Todos', label: 'Todos' },
  { value: 'inStock', label: 'Em estoque' },
  { value: 'low', label: 'Baixo' },
  { value: 'out', label: 'Sem estoque' },
];

const hasStock = (p) => (p.quantidadeTotal ?? 0) > 0;

// Marca + status filter; products that have stock are listed before the empty ones (server
// order is kept inside each group).
export function filterStock(produtos, { marca, status }) {
  const matches = produtos.filter((p) => {
    if (marca && p.linha?.marca?.nome !== marca) return false;
    if (status === 'Todos') return true;
    return status === 'inStock' ? hasStock(p) : getStockState(p.quantidadeTotal, p.estoqueMinimo) === status;
  });
  return [...matches.filter(hasStock), ...matches.filter((p) => !hasStock(p))];
}

export const STOCK_STATE_LABEL = {
  available: 'Disponível',
  low: 'Estoque baixo',
  out: 'Sem estoque',
};
