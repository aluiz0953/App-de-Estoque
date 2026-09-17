import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';
import apiService from '../services/api';

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

const money = (value) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

const REPORT_TYPES = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'movimentacao', label: 'Movimentação' },
  { key: 'vencimentos', label: 'Vencimentos' },
  { key: 'lucro', label: 'Lucro' },
];

const ReportsPage = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('resumo');
  const [dateRange, setDateRange] = useState('month');

  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();

  const vencimentosData = [];
  const lucroData = [];

  const handleGenerateReport = () => {
    alert(`Gerando relatório de ${reportType} para o período ${dateRange}`);
  };

  return (
    <main className="p-5 md:p-9">
      <button onClick={() => navigate(-1)} className="eyebrow mb-3 flex items-center gap-1 hover:text-secondary-dark">
        <span className="mdi mdi-arrow-left" /> Voltar
      </button>
      <h2 className="font-display mb-8 text-[34px] tracking-[-0.03em] md:text-[40px]">Relatórios.</h2>

      <div className="mb-6 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setReportType(key)}
                className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
                  reportType === key ? 'bg-primary text-primary-50' : 'bg-brand-bg text-muted border border-border hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 rounded-lg border border-border bg-brand-bg px-3 text-[12px] outline-none focus:border-secondary-dark"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este ano</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
          <button
            onClick={handleGenerateReport}
            className="pressable rounded-full bg-primary px-5 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark"
          >
            Gerar relatório
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        {reportType === 'resumo' ? (
          <ResumoReport isLoading={isLoadingResumo} error={errorResumo} data={resumo} />
        ) : reportType === 'movimentacao' ? (
          <MovimentacaoReport />
        ) : reportType === 'vencimentos' ? (
          <VencimentosReport data={vencimentosData} />
        ) : (
          <LucroReport data={lucroData} />
        )}
      </div>
    </main>
  );
};

const ResumoReport = ({ isLoading, error, data }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
        <p className="mt-4 text-[12px] text-muted-light">Carregando resumo...</p>
      </div>
    );
  }

  if (error) {
    return <p className="py-12 text-center text-danger">Erro ao carregar resumo: {error.message}</p>;
  }

  if (!data) {
    return <p className="py-12 text-center text-muted-light">Nenhum dado disponível</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-[22px]">Resumo do estoque</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Valor total em estoque" value={money(data.valorTotalEstoque)} />
        <Metric label="Lucro potencial" value={money(data.lucroPotencial)} />
        <Metric label="Número de produtos" value={data.totalProdutos ?? 0} />
        <Metric label="Lotes ativos" value={data.totalLotesAtivos ?? 0} />
      </div>

      <div className="rounded-lg bg-brand-bg p-6">
        <p className="eyebrow mb-2">Em desenvolvimento</p>
        <h4 className="font-display text-[18px]">Distribuição por categoria</h4>
        <p className="mt-2 text-[13px] text-muted">
          Em uma implementação completa, aqui seriam exibidos gráficos mostrando a distribuição do estoque por categoria, marca e linha.
        </p>
      </div>
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-brand-bg p-4">
    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">{label}</p>
    <p className="font-display mt-2 text-[26px] tabular-nums">{value}</p>
  </div>
);

const PERIODOS = [
  { value: '', label: 'Tudo' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
];

const toIsoDate = (date) => date.toISOString().slice(0, 10);

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

  return (
    <div>
      <h3 className="font-display text-[22px]">Relatório de movimentação</h3>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-brand-bg p-1">
          {[{ value: '', label: 'Todas' }, { value: 'ENTRADA', label: 'Entradas' }, { value: 'SAIDA', label: 'Saídas' }].map((t) => (
            <button
              key={t.label}
              onClick={() => setTipo(t.value)}
              className={`rounded-md px-3 py-1.5 text-[11px] ${tipo === t.value ? 'bg-primary text-primary-50' : 'text-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-brand-bg p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriodoDias(p.value)}
              className={`rounded-md px-3 py-1.5 text-[11px] ${periodoDias === p.value ? 'bg-primary text-primary-50' : 'text-muted'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative">
          {selectedProduto ? (
            <button
              onClick={() => { setSelectedProduto(null); setProdutoSearch(''); }}
              className="flex h-9 items-center gap-2 rounded-lg border border-secondary-dark bg-brand-bg px-3 text-[11px]"
            >
              {selectedProduto.nome} <span className="mdi mdi-close-circle text-muted" />
            </button>
          ) : (
            <>
              <input
                value={produtoSearch}
                onChange={(e) => setProdutoSearch(e.target.value)}
                placeholder="Filtrar por produto..."
                className="h-9 w-52 rounded-lg border border-border bg-brand-bg px-3 text-[11px] outline-none focus:border-secondary-dark"
              />
              {produtoResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 rounded-lg border border-border bg-surface shadow-lg">
                  {produtoResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProduto(p); setProdutoResults([]); }}
                      className="block w-full truncate border-b border-border px-3 py-2 text-left text-[11px] last:border-0 hover:bg-brand-bg"
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
            className="h-9 rounded-lg border border-border bg-brand-bg px-3 text-[11px] outline-none focus:border-secondary-dark"
          >
            <option value="">Todos operadores</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
        </div>
      ) : error ? (
        <p className="py-8 text-danger">{error.message}</p>
      ) : !result?.content?.length ? (
        <p className="mt-6 text-[13px] text-muted-light">Nenhuma movimentação encontrada para os filtros selecionados.</p>
      ) : (
        <>
          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <div className="hidden grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr_0.9fr_0.8fr] gap-3 border-b border-border bg-brand-bg px-4 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-light md:grid">
              <span>Produto</span><span>Tipo</span><span>Qtd</span><span>Motivo</span><span>Data</span><span>Operador</span>
            </div>
            {result.content.map((m) => (
              <div key={m.id} className="grid grid-cols-2 gap-3 border-b border-border px-4 py-3 text-[12px] last:border-0 md:grid-cols-[1.4fr_0.6fr_0.6fr_0.9fr_0.9fr_0.8fr]">
                <span className="truncate">{m.produto?.nome}</span>
                <span className={m.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}>{m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span>
                <span className="tabular-nums">{m.quantidade}</span>
                <span className="text-muted">{MOTIVO_LABEL[m.motivo] || m.motivo || '—'}</span>
                <span className="text-muted">{m.dataMovimentacao ? new Date(m.dataMovimentacao).toLocaleString('pt-BR') : ''}</span>
                <span className="text-muted">{m.usuario?.username || '—'}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-light">
            <span>Página {result.number + 1} de {result.totalPages} · {result.totalElements} movimentações</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={page + 1 >= result.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const VencimentosReport = ({ data }) => (
  <div>
    <h3 className="font-display text-[22px]">Relatório de vencimentos</h3>
    <p className="mt-2 text-[13px] text-muted">Produtos vencidos ou prestes a vencer, para apoiar decisões de promoção e descarte.</p>
    <p className="mt-4 text-[13px] text-muted-light">
      {data.length > 0 ? `${data.length} produtos com vencimento iminente` : 'Nenhum produto vencendo no período selecionado'}
    </p>
  </div>
);

const LucroReport = ({ data }) => (
  <div>
    <h3 className="font-display text-[22px]">Relatório de lucro</h3>
    <p className="mt-2 text-[13px] text-muted">Rentabilidade dos produtos: margem de lucro, giro de estoque e reajustes sugeridos.</p>
    <p className="mt-4 text-[13px] text-muted-light">{data.length > 0 ? `${data.length} produtos analisados` : 'Nenhum dado de lucro disponível'}</p>
  </div>
);

export default ReportsPage;
