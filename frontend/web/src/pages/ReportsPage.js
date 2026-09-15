import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Title, Paragraph, List, Button, Icon } from 'react-native-paper';
import { fetchEstoqueResumo } from '../store/slices/inventorySlice';
import { useFetchEstoqueResumo } from '../hooks/useFetchEstoqueResumo';

const ReportsPage = () => {
  const dispatch = useDispatch();
  const [reportType, setReportType] = useState('resumo'); // resumo, movimentacao, vencimentos, lucro
  const [dateRange, setDateRange] = useState('month'); // week, month, quarter, year

  const { data: resumo, isLoading: isLoadingResumo, error: errorResumo } = useFetchEstoqueResumo();

  // In a real app, these would come from specific API endpoints
  const movimentacaoData = []; // Placeholder
  const vencimentosData = []; // Placeholder
  const lucroData = []; // Placeholder

  const handleGenerateReport = () => {
    // In a real app, this would call specific API endpoints based on reportType and dateRange
    alert(`Gerando relatório de ${reportType} para o período ${dateRange}`);
  };

  const handleExportPDF = () => {
    alert('Exportando relatório para PDF...');
  };

  const handleExportExcel = () => {
    alert('Exportando relatório para Excel...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Button mode="text" onPress={() => navigate(-1)}>
              <Icon name="arrow-left" size={24} color="#5B2C6F" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Report Controls */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Title>Selecione o Tipo de Relatório</Title>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setReportType('resumo')}
                    className={`px-3 py-1 text-sm font-medium ${reportType === 'resumo' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} rounded`}
                  >
                    Resumo
                  </button>
                  <button
                    onClick={() => setReportType('movimentacao')}
                    className={`px-3 py-1 text-sm font-medium ${reportType === 'movimentacao' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} rounded`}
                  >
                    Movimentação
                  </button>
                  <button
                    onClick={() => setReportType('vencimentos')}
                    className={`px-3 py-1 text-sm font-medium ${reportType === 'vencimentos' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} rounded`}
                  >
                    Vencimentos
                  </button>
                  <button
                    onClick={() => setReportType('lucro')}
                    className={`px-3 py-1 text-sm font-medium ${reportType === 'lucro' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} rounded`}
                  >
                    Lucro
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <label className="text-sm font-medium text-gray-700">Período:</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mês</option>
                  <option value="quarter">Este Trimestre</option>
                  <option value="year">Este Ano</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  mode="outlined"
                  onPress={handleExportPDF}
                  icon={Icon.name === 'file-pdf' ? 'file-pdf' : 'description'}
                >
                  PDF
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleExportExcel}
                  icon={Icon.name === 'file-excel' ? 'file-excel' : 'table-chart'}
                >
                  Excel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleGenerateReport}
                >
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
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
        </div>
      </main>
    </div>
  );
};

// Component for Resumo Report
const ResumoReport = ({ isLoading, error, data }) => {
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Carregando resumo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar resumo: {error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Title>Resumo do Estoque</Title>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-900">Valor Total em Estoque</h3>
          <p className="text-2xl font-bold text-gray-900">
            R$ {data.valorTotalEstoque?.toFixed(2) ?? '0,00'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-900">Lucro Potencial</h3>
          <p className="text-2xl font-bold text-gray-900">
            R$ {data.lucroPotencial?.toFixed(2) ?? '0,00'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-900">Número de Produtos</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.totalProdutos ?? 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-900">Número de Lotes Ativos</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.totalLotesAtivos ?? 0}
          </p>
        </div>
      </div>

      {/* Charts would go here in a real implementation */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">Distribuição por Categoria</h3>
        <p className="text-gray-600">
          Em uma implementação completa, aqui seriam exibidos gráficos mostrando a distribuição
          do estoque por categoria, marca, linha, etc.
        </p>
        <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center mt-4">
          <p className="text-gray-500">Gráfico de Distribuição</p>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="mt-6">
        <Title>Produtos com Estoque Baixo</Title>
        {/* In a real app, this would come from a filtered API call */}
        <p className="text-gray-600">
          Nenhum produto com estoque crítico encontrado.
        </p>
      </div>

      {/* Expiring Soon Items */}
      <div className="mt-6">
        <Title>Produtos Próximos do Vencimento</Title>
        {/* In a real app, this would come from a filtered API call */}
        <p className="text-gray-600">
          Nenhum produto vencendo nos próximos 30 dias.
        </p>
      </div>
    );
  };
};

// Placeholder components for other report types
const MovimentacaoReport = ({ data }) => {
  return (
    <div>
      <Title>Relatório de Movimentação</Title>
      <p className="text-gray-600">
        Em uma implementação completa, este relatório mostraria todas as entradas e saídas
        de estoque no período selecionado, com filtros por produto, tipo de movimentação, etc.
      </p>
      {data.length > 0 ? (
        <div className="mt-4">
          {/* Would render movimentação data here */}
          <p className="text-gray-600">{data.length} movimentações encontradas</p>
        </div>
      ) : (
        <p className="text-gray-600">Nenhuma movimentação encontrada para o período selecionado</p>
      )}
    </div>
  );
};

const VencimentosReport = ({ data }) => {
  return (
    <div>
      <Title>Relatório de Vencimentos</Title>
      <p className="text-gray-600">
        Este relatório mostra produtos que estão vencidos ou prestes a vencer,
        ajudando na gestão de promoções e descartes.
      </p>
      {data.length > 0 ? (
        <div className="mt-4">
          {/* Would render vencimentos data here */}
          <p className="text-gray-600">{data.length} produtos com vencimento iminente</p>
        </div>
      ) : (
        <p className="text-gray-600">Nenhum produto vencendo no período selecionado</p>
      )}
    </div>
  );
};

const LucroReport = ({ data }) => {
  return (
    <div>
      <Title>Relatório de Lucro</Title>
      <p className="text-gray-600">
        Este relatório analisa a rentabilidade dos produtos, mostrando margem de lucro,
        giro de estoque e sugestões de reajuste de preços.
      </p>
      {data.length > 0 ? (
        <div className="mt-4">
          {/* Would render lucro data here */}
          <p className="text-gray-600">{data.length} produtos analisados</p>
        </div>
      ) : (
        <p className="text-gray-600">Nenhum dado de lucro disponível</p>
      )}
    </div>
  );
};

export default ReportsPage;