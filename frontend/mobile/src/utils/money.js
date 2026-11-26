// R$ 8.430,00: pt-BR grouping and decimals, in one place.
export const money = (value) => {
  const n = Number(value ?? 0);
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${n < 0 ? '-' : ''}R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
};
