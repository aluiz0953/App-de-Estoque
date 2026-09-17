import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetchProductById } from '../hooks/useFetchProductById';
import { useFetchProductLotes } from '../hooks/useFetchProductLotes';

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading: isLoadingProduct, error: errorProduct } = useFetchProductById(id);
  const { data: lotes, isLoading: isLoadingLotes, error: errorLotes } = useFetchProductLotes(id);

  if (isLoadingProduct || isLoadingLotes) {
    return (
      <main className="p-5 md:p-9">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
          <p className="mt-4 text-[12px] text-muted-light">Carregando produto...</p>
        </div>
      </main>
    );
  }

  if (errorProduct || errorLotes) {
    return (
      <main className="p-5 md:p-9">
        <p className="text-danger">Erro ao carregar produto: {(errorProduct || errorLotes).message}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[12px] font-medium text-secondary-dark hover:text-primary">
          Voltar
        </button>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="p-5 md:p-9">
        <p className="text-muted">Produto não encontrado</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[12px] font-medium text-secondary-dark hover:text-primary">
          Voltar
        </button>
      </main>
    );
  }

  const lucroUnitario = (product.precoVenda ?? 0) - (product.precoCusto ?? 0);
  const statusEstoque =
    product.quantidadeTotal < product.estoqueMinimo ? 'Crítico' : product.quantidadeTotal > product.estoqueMaximo ? 'Excedente' : 'Normal';
  const statusBadge =
    statusEstoque === 'Crítico' ? 'bg-[#ded7d4] text-[#716562]' : statusEstoque === 'Excedente' ? 'bg-[#f0d6c5] text-[#94634d]' : 'bg-[#dce6d8] text-[#5f7658]';

  return (
    <main className="p-5 md:p-9">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <button onClick={() => navigate(-1)} className="eyebrow mb-3 flex items-center gap-1 hover:text-secondary-dark">
            <span className="mdi mdi-arrow-left" /> Voltar
          </button>
          <h2 className="font-display text-[34px] tracking-[-0.03em] md:text-[40px]">{product.nome}</h2>
        </div>
        <button
          onClick={() => navigate(`/produtos/${id}/editar`)}
          className="pressable flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark"
        >
          <span className="mdi mdi-pencil-outline text-[14px]" /> Editar
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="eyebrow mb-3">Informações</p>
            <dl className="space-y-2 text-[13px]">
              <Row label="SKU" value={product.sku} mono />
              <Row label="Descrição" value={product.descricao || 'Não informada'} />
              <Row label="Marca" value={product.linha?.marca?.nome || 'Não informada'} />
              <Row label="Linha" value={product.linha?.nome || 'Não informada'} />
              <Row label="Tipo" value={product.tipoProduto || 'Não informado'} />
              <Row label="Fragrância" value={product.fragrancia || 'Não informada'} />
              <Row label="Preço de custo" value={money(product.precoCusto)} mono />
              <Row label="Preço de venda" value={money(product.precoVenda)} mono />
            </dl>
          </div>

          <div>
            <p className="eyebrow mb-3">Margem de lucro</p>
            <dl className="space-y-2 text-[13px]">
              <Row label="Margem" value={`${(product.margemLucroPercentual ?? 0).toFixed(2)}%`} mono />
              <Row label="Saudável" value={product.margemLucroPercentual >= 30 ? 'Sim' : 'Não'} />
              <Row
                label="Categoria"
                value={
                  product.margemLucroPercentual >= 50
                    ? 'Excelente'
                    : product.margemLucroPercentual >= 30
                      ? 'Boa'
                      : product.margemLucroPercentual >= 15
                        ? 'Regular'
                        : 'Baixa'
                }
              />
              <Row label="Lucro unitário" value={money(lucroUnitario)} mono />
            </dl>
          </div>

          <div>
            <p className="eyebrow mb-3">Estoque</p>
            <dl className="space-y-2 text-[13px]">
              <Row label="Total" value={product.quantidadeTotal} mono />
              <Row label="Mínimo" value={product.estoqueMinimo} mono />
              <Row label="Máximo" value={product.estoqueMaximo} mono />
              <Row label="Valor em estoque" value={money(product.quantidadeTotal * product.precoVenda)} mono />
              <div className="flex items-center justify-between pt-1">
                <dt className="text-muted-light">Status</dt>
                <dd className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] ${statusBadge}`}>{statusEstoque}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_12px_35px_rgba(63,47,35,0.04)]">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="font-display text-[22px]">Lotes em estoque</h3>
          <span className="text-[11px] text-muted-light">Total: {lotes?.length || 0}</span>
        </div>

        {lotes && lotes.length > 0 ? (
          <div className="divide-y divide-[#eee7df]">
            {lotes.map((lote) => {
              const badge = lote.vencido
                ? 'bg-[#ded7d4] text-[#716562]'
                : lote.expirandoEmBreve
                  ? 'bg-[#f0d6c5] text-[#94634d]'
                  : 'bg-[#dce6d8] text-[#5f7658]';
              const diasParaValidade = lote.dataValidade
                ? Math.ceil((new Date(lote.dataValidade) - new Date()) / (1000 * 60 * 60 * 24))
                : null;
              const lucroPotencial = (product.precoVenda - lote.precoCustoLote) * lote.quantidade;
              return (
                <div key={lote.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium">Lote #{lote.numeroLote}</p>
                      <p className="mt-0.5 text-[11px] text-muted-light">Fornecedor: {lote.fornecedor?.nome || 'Não informado'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${badge}`}>
                        {lote.vencido ? 'Vencido' : lote.expirandoEmBreve ? 'Expirando' : 'Válido'}
                      </span>
                      <span className="text-[13px] font-medium tabular-nums">{lote.quantidade} un.</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[12px] text-muted md:grid-cols-3">
                    <p>Fabricação: {lote.dataFabricacao ? new Date(lote.dataFabricacao).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p>Validade: {lote.dataValidade ? new Date(lote.dataValidade).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p className="tabular-nums">Custo do lote: {money(lote.precoCustoLote)}</p>
                    <p>Dias p/ validade: {diasParaValidade ?? 'N/A'}</p>
                    <p className="tabular-nums">Lucro potencial: {money(lucroPotencial)}</p>
                    <p>Status: {lote.status || 'Ativo'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-[12px] text-muted-light">Nenhum lote encontrado para este produto</p>
        )}
      </section>
    </main>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-3">
    <dt className="text-muted-light">{label}</dt>
    <dd className={`text-right ${mono ? 'tabular-nums' : ''}`}>{value}</dd>
  </div>
);

export default ProductDetailPage;
