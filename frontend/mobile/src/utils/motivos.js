// Mirrors backend's MovimentacaoEstoque.MotivoMovimentacao enum — every stock
// entry/withdrawal must carry one of these (see InventoryController's `motivo`
// required param). Keys are sent to the API verbatim.
export const MOTIVOS_ENTRADA = [
  { value: 'COMPRA_RECEBIDA', label: 'Compra recebida' },
  { value: 'ESTOQUE_INICIAL', label: 'Estoque inicial' },
  { value: 'DEVOLUCAO', label: 'Devolução de cliente' },
  { value: 'OUTRO', label: 'Outro' },
];

export const MOTIVOS_SAIDA = [
  { value: 'VENDA', label: 'Venda' },
  { value: 'DEVOLUCAO', label: 'Devolução' },
  { value: 'DANIFICADO', label: 'Danificado' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'PERDA', label: 'Perda' },
  { value: 'CORRECAO_CONTAGEM', label: 'Correção de contagem' },
  { value: 'OUTRO', label: 'Outro' },
];

export const MOTIVO_LABEL = Object.fromEntries(
  [...MOTIVOS_ENTRADA, ...MOTIVOS_SAIDA].map(({ value, label }) => [value, label])
);
