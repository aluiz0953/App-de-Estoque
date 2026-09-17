import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';

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

  const movimentacaoData = [];
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
          <MovimentacaoReport data={movimentacaoData} />
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

const MovimentacaoReport = ({ data }) => (
  <div>
    <h3 className="font-display text-[22px]">Relatório de movimentação</h3>
    <p className="mt-2 text-[13px] text-muted">
      Em uma implementação completa, este relatório mostraria todas as entradas e saídas de estoque no período selecionado.
    </p>
    <p className="mt-4 text-[13px] text-muted-light">
      {data.length > 0 ? `${data.length} movimentações encontradas` : 'Nenhuma movimentação encontrada para o período selecionado'}
    </p>
  </div>
);

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
