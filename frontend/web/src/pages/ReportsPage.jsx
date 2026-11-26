import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';
import apiService from '../services/api';
import PageHead from '../components/PageHead';
import { money } from '../utils/money';

const MOTIVO_LABEL = {
  COMPRA_RECEBIDA: 'Compra recebida',
  ESTOQUE_INICIAL: 'Estoque inicial',
  VENDA: 'Venda',
  DEVOLUCAO: 'Devolução',
  DANIFICADO: 'Danificado',
  VENCIDO: 'Vencido',
  PERDA: 'Perda',
  CORRECAO_CONTAGEM: 'Correção de contagem',
  OUTRO: 'Outro',
};

const REPORT_TYPES = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'movimentacao', label: 'Movimentação' },
  { key: 'vencimentos', label: 'Vencimentos' },
  { key: 'lucro', label: 'Lucro' },
];

const ReportsPage = () => {
  const [reportType, setReportType] = useState('resumo');
  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-6 md:px-9 md:py-8">
      <PageHead title="Relatórios" />

      <div className="mb-6 flex flex-wrap gap-x-5 border-b border-border" role="tablist" aria-label="Tipo de relatório">
        {REPORT_TYPES.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={reportType === key}
            onClick={() => setReportType(key)}
            className={`tab-link ${reportType === key ? 'tab-link-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {reportType === 'resumo' ? (
        <ResumoReport isLoading={isLoadingResumo} error={errorResumo} data={resumo} />
      ) : reportType === 'movimentacao' ? (
        <MovimentacaoReport />
      ) : reportType === 'vencimentos' ? (
        <NotAvailable
          title="Vencimentos"
          text="Este relatório ainda não está disponível. Enquanto isso, o que está perto de vencer aparece no Painel e em Notificações."
        />
      ) : (
        <NotAvailable
          title="Lucro"
          text="Este relatório ainda não está disponível. A margem e o lucro unitário de cada produto estão na página do produto."
        />
      )}
    </main>
  );
};

const NotAvailable = ({ title, text }) => (
  <div className="sheet px-5 py-10">
    <h2 className="text-[15px] font-semibold">{title}</h2>
    <p className="mt-1 max-w-[62ch] text-[13px] text-muted">{text}</p>
    <Link to="/" className="btn btn-quiet mt-4">
      Ir para o Painel
    </Link>
  </div>
);

const ResumoReport = ({ isLoading, error, data }) => {
  if (isLoading) return <p className="text-[13px] text-muted" aria-busy="true">Carregando resumo…</p>;
  if (error) return <p className="text-[13px] text-danger">Erro ao carregar resumo: {error.message}</p>;
  if (!data) return <p className="text-[13px] text-muted">Nenhum dado disponível.</p>;

  return (
    <section aria-labelledby="resumo-estoque">
      <h2 id="resumo-estoque" className="mb-3 text-[15px] font-semibold">
        Resumo do estoque
      </h2>
      <dl className="sheet px-5 text-[13px]">
        <Row label="Valor total em estoque" value={money(data.valorTotalEstoque)} />
        <Row label="Lucro potencial" value={money(data.lucroPotencial)} />
        <Row label="Número de produtos" value={data.totalProdutos ?? 0} />
        <Row label="Lotes ativos" value={data.totalLotesAtivos ?? 0} />
        <Row label="Lotes vencidos" value={data.totalLotesVencidos ?? 0} />
      </dl>
    </section>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-border py-3 last:border-0">
    <dt className="text-muted">{label}</dt>
    <dd className="font-mono text-[15px] font-semibold tabular-nums">{value}</dd>
  </div>
);

const PERIODOS = [
  { value: '', label: 'Tudo' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
];

const TIPOS = [
  { value: '', label: 'Todas' },
  { value: 'ENTRADA', label: 'Entradas' },
  { value: 'SAIDA', label: 'Saídas' },
];

const toIsoDate = (date) => date.toISOString().slice(0, 10);
const COLUMNS = 'md:grid-cols-[minmax(0,1.4fr)_90px_70px_minmax(0,0.9fr)_150px_minmax(0,0.7fr)]';

const MovimentacaoReport = () => {
  const [tipo, setTipo] = useState('');
  const [periodoDias, setPeriodoDias] = useState('');
  const [produtoSearch, setProdutoSearch] = useState('');
  const [produtoResults, setProdutoResults] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    apiService.getUsuarios().then(setUsuarios).catch(() => setUsuarios([]));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (produtoSearch.trim().length < 2) {
      setProdutoResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      apiService.getProducts({ search: produtoSearch.trim() }).then((r) => setProdutoResults((r || []).slice(0, 8)));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [produtoSearch]);

  useEffect(() => setPage(0), [tipo, periodoDias, selectedProduto, usuarioId]);

  useEffect(() => {
    const params = { page, size: 20 };
    if (tipo) params.tipo = tipo;
    if (selectedProduto) params.produtoId = selectedProduto.id;
    if (usuarioId) params.usuarioId = usuarioId;
    if (periodoDias) {
      params.dataInicio = toIsoDate(new Date(Date.now() - Number(periodoDias) * 86400000));
      params.dataFim = toIsoDate(new Date());
    }
    setIsLoading(true);
    apiService
      .getMovimentacoesHistorico(params)
      .then((r) => {
        setResult(r);
        setError(null);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [tipo, periodoDias, selectedProduto, usuarioId, page]);

  const tabs = (items, current, set, label) => (
    <div className="flex gap-x-5 border-b border-border" role="tablist" aria-label={label}>
      {items.map((t) => (
        <button
          key={t.label}
          role="tab"
          aria-selected={current === t.value}
          onClick={() => set(t.value)}
          className={`tab-link ${current === t.value ? 'tab-link-active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <section aria-labelledby="mov-report">
      <h2 id="mov-report" className="mb-3 text-[15px] font-semibold">
        Relatório de movimentação
      </h2>

      <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-3">
        {tabs(TIPOS, tipo, setTipo, 'Tipo')}
        {tabs(PERIODOS, periodoDias, setPeriodoDias, 'Período')}

        <div className="relative">
          {selectedProduto ? (
            <button
              onClick={() => {
                setSelectedProduto(null);
                setProdutoSearch('');
              }}
              className="btn btn-quiet h-9 border-primary-dark text-[12px]"
            >
              {selectedProduto.nome} <span className="mdi mdi-close-circle text-muted" aria-hidden="true" />
            </button>
          ) : (
            <>
              <input
                value={produtoSearch}
                onChange={(e) => setProdutoSearch(e.target.value)}
                placeholder="Filtrar por produto..."
                aria-label="Filtrar por produto"
                className="input h-9 w-52 text-[12px]"
              />
              {produtoResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 overflow-hidden rounded-md border border-border bg-surface shadow-[0_8px_24px_-8px_rgba(23,32,27,0.25)]">
                  {produtoResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProduto(p);
                        setProdutoResults([]);
                      }}
                      className="block w-full truncate border-b border-border px-3 py-2 text-left text-[12px] last:border-0 hover:bg-brand-bg"
                    >
                      {p.nome} · {p.sku}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {usuarios.length > 0 && (
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            aria-label="Operador"
            className="h-9 rounded-md border border-border bg-surface px-3 text-[12px] text-ink outline-none focus:border-primary"
          >
            <option value="">Todos operadores</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <p className="py-6 text-[13px] text-muted" aria-busy="true">Carregando…</p>
      ) : error ? (
        <p className="py-6 text-[13px] text-danger">{error.message}</p>
      ) : !result?.content?.length ? (
        <div className="sheet px-5 py-10">
          <p className="text-[14px] font-medium">Nenhuma movimentação para esses filtros.</p>
          <p className="mt-1 max-w-[60ch] text-[13px] text-muted">Cada entrada de romaneio e cada saída com motivo aparecem aqui.</p>
        </div>
      ) : (
        <>
          <div className="listing">
            <div className={`listing-head hidden ${COLUMNS} md:grid`}>
              <span>Produto</span>
              <span>Tipo</span>
              <span className="text-right">Qtd</span>
              <span>Motivo</span>
              <span>Data</span>
              <span>Operador</span>
            </div>
            <div className="listing-body">
              {result.content.map((m) => (
                <div key={m.id} className={`listing-row grid-cols-2 gap-y-1 ${COLUMNS}`}>
                  <span className="col-span-2 truncate font-medium md:col-span-1">{m.produto?.nome}</span>
                  <span>
                    <span className={`stamp ${m.tipo === 'ENTRADA' ? 'stamp-ok' : 'stamp-low'}`}>{m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span>
                  </span>
                  <span className="font-mono tabular-nums md:text-right">{m.quantidade}</span>
                  <span className="text-muted">{MOTIVO_LABEL[m.motivo] || m.motivo || '—'}</span>
                  <span className="font-mono text-[12px] text-muted">{m.dataMovimentacao ? new Date(m.dataMovimentacao).toLocaleString('pt-BR') : ''}</span>
                  <span className="truncate text-muted">{m.usuario?.username || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
            <span>
              Página {result.number + 1} de {result.totalPages} · {result.totalElements} movimentações
            </span>
            <div className="flex gap-2">
              <button disabled={page <= 0} onClick={() => setPage((p) => p - 1)} className="btn btn-quiet">
                Anterior
              </button>
              <button disabled={page + 1 >= result.totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-quiet">
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ReportsPage;
