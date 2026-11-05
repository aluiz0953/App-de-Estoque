import React from 'react';

// Stock state in form, never hue alone: full bar = ok, dashed = low, struck = out, doubled = expiring.
// `state` is the Portuguese label the pages already use; the text label always travels with the mark.
export const stockState = (quantidade, minimo, vencendo = 0) => {
  const qty = quantidade ?? 0;
  if (qty <= 0) return 'out';
  if (minimo > 0 && qty <= minimo) return 'low';
  if (vencendo > 0) return 'expiring';
  return 'ok';
};

const LABEL = { ok: 'Em estoque', low: 'Baixo', out: 'Sem estoque', expiring: 'Vencendo' };

// Literal class names: Tailwind only keeps component classes it can read in the source.
const GLYPH = {
  ok: 'stockmark stockmark-ok',
  low: 'stockmark stockmark-low',
  out: 'stockmark stockmark-out',
  expiring: 'stockmark stockmark-expiring',
};

const StockMark = ({ state, label = true }) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap text-[12px] text-ink">
    <span className={GLYPH[state]} aria-hidden="true" />
    {label ? LABEL[state] : <span className="sr-only">{LABEL[state]}</span>}
  </span>
);

export default StockMark;
