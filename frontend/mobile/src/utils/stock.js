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

// "Ordenar" chips of the Estoque tab: by name (A to Z / Z to A) or by sale price.
export const SORT_OPTIONS = [
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
];

const byName = (a, b) => String(a.nome ?? '').localeCompare(String(b.nome ?? ''), 'pt-BR', { sensitivity: 'base' });

// Products without a price go last in the price orders; ties fall back to the name.
export function sortProdutos(produtos, sort) {
  const list = [...produtos];
  const price = (p) => (typeof p.precoVenda === 'number' ? p.precoVenda : null);
  if (sort === 'za') return list.sort((a, b) => byName(b, a));
  if (sort === 'menor' || sort === 'maior') {
    const direction = sort === 'menor' ? 1 : -1;
    return list.sort((a, b) => {
      const pa = price(a);
      const pb = price(b);
      if (pa === null && pb === null) return byName(a, b);
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pa === pb ? byName(a, b) : (pa - pb) * direction;
    });
  }
  return list.sort(byName);
}

// Marca + status filter. With a chosen sort the whole list follows it; without one, products that
// have stock are listed before the empty ones (server order is kept inside each group).
export function filterStock(produtos, { marca, status, sort }) {
  const matches = produtos.filter((p) => {
    if (marca && p.linha?.marca?.nome !== marca) return false;
    if (status === 'Todos') return true;
    return status === 'inStock' ? hasStock(p) : getStockState(p.quantidadeTotal, p.estoqueMinimo) === status;
  });
  if (sort) return sortProdutos(matches, sort);
  return [...matches.filter(hasStock), ...matches.filter((p) => !hasStock(p))];
}

export const STOCK_STATE_LABEL = {
  available: 'Disponível',
  low: 'Estoque baixo',
  out: 'Sem estoque',
};
