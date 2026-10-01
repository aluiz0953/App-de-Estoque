import React, { useMemo } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// The "Movimentações" chart of the Figma design: entradas as a solid green line over a soft
// green area, saídas as a dashed pink line, light horizontal grid, small muted axes.
const GREEN = '#239e4b';
const PINK = '#dd6383';
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const inicioSemana = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

// One row per week across the whole period (weeks without movement count 0, so the lines don't skip them).
export function agruparPorSemana(entradas, saidas, dias) {
  const rows = new Map();
  const fim = new Date();
  for (let d = inicioSemana(new Date(fim.getTime() - dias * 86400000)); d <= fim; d = new Date(d.getTime() + 7 * 86400000)) {
    rows.set(d.getTime(), { data: d, label: `${d.getDate()} ${MESES[d.getMonth()]}`, entradas: 0, saidas: 0 });
  }
  const somar = (lista, campo) => {
    for (const m of lista || []) {
      const row = rows.get(inicioSemana(m.dataMovimentacao).getTime());
      if (row) row[campo] += m.quantidade;
    }
  };
  somar(entradas, 'entradas');
  somar(saidas, 'saidas');
  return Array.from(rows.values());
}

const Dot = ({ color, children }) => (
  <span className="flex items-center gap-1.5">
    <i className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
    {children}
  </span>
);

const MovimentacoesChart = ({ entradas, saidas, dias = 45 }) => {
  const rows = useMemo(() => agruparPorSemana(entradas, saidas, dias), [entradas, saidas, dias]);

  return (
    <div>
      <div className="flex gap-4 text-[11px] text-muted">
        <Dot color={GREEN}>Entradas</Dot>
        <Dot color={PINK}>Saídas</Dot>
      </div>
      <div className="h-64 pb-4 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="entradasFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2ca654" stopOpacity="0.2" />
                <stop offset="1" stopColor="#2ca654" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-muted-light)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-light)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              labelFormatter={(label) => `Semana de ${label}`}
            />
            <Area type="monotone" dataKey="entradas" name="Entradas" stroke={GREEN} strokeWidth={2} fill="url(#entradasFill)" dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="saidas" name="Saídas" stroke={PINK} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MovimentacoesChart;
