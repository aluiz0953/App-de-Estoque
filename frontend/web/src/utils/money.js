// R$ 8.430,00: pt-BR grouping and decimals, in one place.
const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (value) => `R$ ${fmt.format(value ?? 0)}`;
