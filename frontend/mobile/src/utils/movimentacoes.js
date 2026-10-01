const DIA = 86400000;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const meiaNoite = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// One point per bucket across the whole period (buckets without movement count 0): daily up to
// 2 weeks, weekly up to 3 months, monthly beyond. Same grouping as the web dashboard chart.
export function agrupar(entradas, saidas, dias) {
  const passo = dias <= 14 ? 1 : dias <= 90 ? 7 : 30;
  const inicio = meiaNoite(Date.now() - dias * DIA).getTime();
  const rows = [];
  for (let t = inicio; t <= Date.now(); t += passo * DIA) {
    const d = new Date(t);
    rows.push({ label: `${d.getDate()} ${MESES[d.getMonth()]}`, entradas: 0, saidas: 0 });
  }
  const somar = (lista, campo) => {
    for (const m of lista || []) {
      const i = Math.floor((meiaNoite(m.dataMovimentacao).getTime() - inicio) / (passo * DIA));
      if (rows[i]) rows[i][campo] += m.quantidade;
    }
  };
  somar(entradas, 'entradas');
  somar(saidas, 'saidas');
  return rows;
}
