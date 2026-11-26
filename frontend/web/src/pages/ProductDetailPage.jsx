import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetchProductById } from '../hooks/useFetchProductById';
import { useFetchProductLotes } from '../hooks/useFetchProductLotes';
import PageHead from '../components/PageHead';
import StockMark, { stockState } from '../components/StockMark';
import { money } from '../utils/money';

const COLUMNS = 'lg:grid-cols-[minmax(0,1fr)_100px_100px_70px_100px_70px_100px]';

const BackLink = ({ onClick }) => (
  <button onClick={onClick} className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
    <span className="mdi mdi-arrow-left" aria-hidden="true" /> Voltar
  </button>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading: isLoadingProduct, error: errorProduct } = useFetchProductById(id);
  const { data: lotes, isLoading: isLoadingLotes, error: errorLotes } = useFetchProductLotes(id);

  if (isLoadingProduct || isLoadingLotes) {
    return (
      <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
        <p className="text-[13px] text-muted" aria-busy="true">Carregando produto…</p>
      </main>
    );
  }

  if (errorProduct || errorLotes) {
    return (
      <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
        <BackLink onClick={() => navigate(-1)} />
        <p className="text-[13px] text-danger">Erro ao carregar produto: {(errorProduct || errorLotes).message}</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
        <BackLink onClick={() => navigate(-1)} />
        <p className="text-[13px] text-muted">Produto não encontrado</p>
      </main>
    );
  }

  const lucroUnitario = (product.precoVenda ?? 0) - (product.precoCusto ?? 0);
  const statusEstoque =
    product.quantidadeTotal < product.estoqueMinimo ? 'Crítico' : product.quantidadeTotal > product.estoqueMaximo ? 'Excedente' : 'Normal';
  const state = stockState(product.quantidadeTotal, product.estoqueMinimo, product.quantidadeVencendoProximos30Dias);

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <BackLink onClick={() => navigate(-1)} />
      <PageHead title={product.nome} meta={`${product.linha?.marca?.nome || 'Marca não informada'} · ${product.linha?.nome || 'Linha não informada'}`}>
        <button onClick={() => navigate(`/produtos/${id}/editar`)} className="btn btn-primary">
          <span className="mdi mdi-pencil-outline text-[16px]" aria-hidden="true" /> Editar
        </button>
      </PageHead>

      <div className="sheet grid grid-cols-1 gap-x-10 gap-y-8 p-6 md:grid-cols-3">
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Informações</h2>
          <dl className="text-[13px]">
            <Row label="SKU" value={product.sku} mono />
            <Row label="Descrição" value={product.descricao || 'Não informada'} />
            <Row label="Marca" value={product.linha?.marca?.nome || 'Não informada'} />
            <Row label="Linha" value={product.linha?.nome || 'Não informada'} />
            <Row label="Tipo" value={product.tipoProduto || 'Não informado'} />
            <Row label="Fragrância" value={product.fragrancia || 'Não informada'} />
            <Row label="Preço de custo" value={money(product.precoCusto)} mono />
            <Row label="Preço de venda" value={money(product.precoVenda)} mono />
          </dl>
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Margem de lucro</h2>
          <dl className="text-[13px]">
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
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Estoque</h2>
          <dl className="text-[13px]">
            <Row label="Total" value={product.quantidadeTotal} mono />
            <Row label="Mínimo" value={product.estoqueMinimo} mono />
            <Row label="Máximo" value={product.estoqueMaximo} mono />
            <Row label="Valor em estoque" value={money(product.quantidadeTotal * product.precoVenda)} mono />
            <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
              <dt className="text-muted">Status</dt>
              <dd className="flex items-center gap-3">
                <StockMark state={state} />
                <span className="font-mono text-[11px] uppercase text-muted">{statusEstoque}</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="lotes">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="lotes" className="text-[15px] font-semibold">
            Lotes em estoque
          </h2>
          <span className="font-mono text-[12px] text-muted">{lotes?.length || 0}</span>
        </div>

        {lotes && lotes.length > 0 ? (
          <div className="listing">
            <div className={`listing-head hidden ${COLUMNS} lg:grid`}>
              <span>Lote</span>
              <span>Fabricação</span>
              <span>Validade</span>
              <span className="text-right">Dias</span>
              <span className="text-right">Custo</span>
              <span className="text-right">Qtd</span>
              <span>Situação</span>
            </div>
            <div className="listing-body">
              {lotes.map((lote) => {
                const diasParaValidade = lote.dataValidade
                  ? Math.ceil((new Date(lote.dataValidade) - new Date()) / (1000 * 60 * 60 * 24))
                  : null;
                const lucroPotencial = (product.precoVenda - lote.precoCustoLote) * lote.quantidade;
                const stamp = lote.vencido ? 'stamp-off' : lote.expirandoEmBreve ? 'stamp-warn' : 'stamp-ok';
                return (
                  <div key={lote.id} className={`listing-row grid-cols-2 gap-y-1 ${COLUMNS}`}>
                    <div className="col-span-2 min-w-0 lg:col-span-1">
                      <p className="truncate font-medium">Lote #{lote.numeroLote}</p>
                      <p className="truncate text-[12px] text-muted">
                        {lote.fornecedor?.nome || 'Fornecedor não informado'} · lucro potencial {money(lucroPotencial)}
                      </p>
                    </div>
                    <span className="font-mono text-[12px] text-muted">
                      {lote.dataFabricacao ? new Date(lote.dataFabricacao).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                    <span className="font-mono text-[12px]">{lote.dataValidade ? new Date(lote.dataValidade).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    <span className="font-mono text-[12px] tabular-nums text-muted lg:text-right">{diasParaValidade ?? 'N/A'}</span>
                    <span className="font-mono tabular-nums text-muted lg:text-right">{money(lote.precoCustoLote)}</span>
                    <span className="font-mono tabular-nums lg:text-right">{lote.quantidade} un.</span>
                    <span>
                      <span className={`stamp ${stamp}`}>{lote.vencido ? 'Vencido' : lote.expirandoEmBreve ? 'Expirando' : 'Válido'}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="sheet px-5 py-10">
            <p className="text-[14px] font-medium">Nenhum lote encontrado para este produto.</p>
            <p className="mt-1 max-w-[60ch] text-[13px] text-muted">
              Os lotes aparecem aqui depois da primeira entrada de romaneio, feita no app do celular.
            </p>
            <Link to="/estoque" className="btn btn-quiet mt-4">
              Voltar ao estoque
            </Link>
          </div>
        )}
      </section>
    </main>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0">
    <dt className="text-muted">{label}</dt>
    <dd className={`text-right ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</dd>
  </div>
);

export default ProductDetailPage;
