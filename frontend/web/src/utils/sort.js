// Sorting of the product list: by name (A to Z / Z to A, accent-aware) or by sale price (low to high / high to low).
// Products without a price go last in the price orders; ties fall back to the name.
export const SORT_OPTIONS = [
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
];

const byName = (a, b) => String(a.nome ?? '').localeCompare(String(b.nome ?? ''), 'pt-BR', { sensitivity: 'base' });

export function sortProducts(products, sort) {
  const list = [...products];
  const price = (p) => (typeof p.precoVenda === 'number' ? p.precoVenda : null);
  switch (sort) {
    case 'za':
      return list.sort((a, b) => byName(b, a));
    case 'menor':
    case 'maior': {
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
    default:
      return list.sort(byName);
  }
}
