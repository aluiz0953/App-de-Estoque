import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Title, Paragraph, List, Button, Avatar, Icon } from 'react-native-paper';
import { fetchProductById, fetchProductLotes } from '../store/slices/inventorySlice';
import { useFetchProductById } from '../hooks/useFetchProductById';
import { useFetchProductLotes } from '../hooks/useFetchProductLotes';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: product, isLoading: isLoadingProduct, error: errorProduct } = useFetchProductById(id);
  const { data: lotes, isLoading: isLoadingLotes, error: errorLotes } = useFetchProductLotes(id);

  const handleEdit = () => {
    navigate(`/produtos/${id}/editar`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoadingProduct || isLoadingLotes) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Carregando produto...</p>
      </div>
    );
  }

  if (errorProduct || errorLotes) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center py-12">
        <p className="text-red-600">Erro ao carregar produto: {(errorProduct || errorLotes).message}</p>
        <Button mode="text" onPress={handleBack}>
          Voltar
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center py-12">
        <p className="text-gray-600">Produto não encontrado</p>
        <Button mode="text" onPress={handleBack}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Button mode="text" onPress={handleBack}>
              <Icon name="arrow-left" size={24} color="#5B2C6F" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{product.nome}</h1>
            <Button mode="contained" onPress={handleEdit}>
              Editar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Product Info */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Title>Informações do Produto</Title>
                <p className="text-gray-600 mb-2"><strong>SKU:</strong> {product.sku}</p>
                <p className="text-gray-600 mb-2"><strong>Descrição:</strong> {product.descricao || 'Não informada'}</p>
                <p className="text-gray-600 mb-2"><strong>Marca:</strong> {product.linha?.marca?.nome || 'Não informada'}</p>
                <p className="text-gray-600 mb-2"><strong>Linha:</strong> {product.linha?.nome || 'Não informada'}</p>
                <p className="text-gray-600 mb-2"><strong>Preço de Custo:</strong> R$ {product.precoCusto?.toFixed(2) || '0,00'}</p>
                <p className="text-gray-600 mb-2"><strong>Preço de Venda:</strong> R$ {product.precoVenda?.toFixed(2) || '0,00'}</p>
              </div>

              <div>
                <Title>Margem de Lucro</Title>
                <p className="text-gray-600 mb-2"><strong>Margem (%):</strong> {product.margemLucroPercentual?.toFixed(2) || '0,00'}%</p>
                <p className="text-gray-600 mb-2"><strong>Margem Saudável:</strong> {product.margemLucroPercentual >= 30 ? 'Sim' : 'Não'}</p>
                <p className="text-gray-600 mb-2"><strong>Categoria:</strong>
                  {product.margemLucroPercentual >= 50 ? 'Excelente' :
                   product.margemLucroPercentual >= 30 ? 'Boa' :
                   product.margemLucroPercentual >= 15 ? 'Regular' : 'Baixa'}
                </p>
                <p className="text-gray-600"><strong>Lucro Unitário:</strong> R$ {(product.precoVenda - product.precoCusto)?.toFixed(2) || '0,00'}</p>
              </div>

              <div>
                <Title>Estoque</Title>
                <p className="text-gray-600 mb-2"><strong>Estoque Total:</strong> {product.quantidadeTotal}</p>
                <p className="text-gray-600 mb-2"><strong>Estoque Mínimo:</strong> {product.estoqueMinimo}</p>
                <p className="text-gray-600 mb-2"><strong>Estoque Máximo:</strong> {product.estoqueMaximo}</p>
                <p className="text-gray-600 mb-2"><strong>Status:</strong>
                  {product.quantidadeTotal < product.estoqueMinimo ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Crítico</span>
                  ) : product.quantidadeTotal > product.estoqueMaximo ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Excedente</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Normal</span>
                  )}
                </p>
                <p className="text-gray-600"><strong>Valor em Estoque:</strong> R$ {(product.quantidadeTotal * product.precoVenda)?.toFixed(2) || '0,00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lotes */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Title>Lotes em Estoque</Title>
              <span className="text-sm text-gray-500">Total de lotes: {lotes?.length || 0}</span>
            </div>

            {isLoadingLotes ? (
              <p className="text-center py-4 text-gray-500">Carregando lotes...</p>
            ) : errorLotes ? (
              <p className="text-center py-4 text-red-600">Erro ao carregar lotes: {errorLotes.message}</p>
            ) : lotes && lotes.length > 0 ? (
              <div className="space-y-4">
                {lotes.map((lote) => (
                  <div key={lote.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">Lote #{lote.numeroLote}</h3>
                        <p className="text-sm text-gray-600">Fornecedor: {lote.fornecedor?.nome || 'Não informado'}</p>
                      </div>
                      <div className="text-right space-x-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          lote.vencido ? 'bg-red-100 text-red-800' :
                          lote.expirandoEmBreve ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {lote.vencido ? 'Vencido' : lote.expirandoEmBreve ? 'Expirando' : 'Válido'}
                        </span>
                        <span className="text-sm font-medium">{lote.quantidade} unidades</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Data de Fabricação:</strong> {lote.dataFabricacao ? new Date(lote.dataFabricacao).toLocaleDateString('pt-BR') : 'Não informada'}</p>
                          <p><strong>Data de Validade:</strong> {lote.dataValidade ? new Date(lote.dataValidade).toLocaleDateString('pt-BR') : 'Não informada'}</p>
                          <p><strong>Preço de Custo:</strong> R$ {lote.precoCusto?.toFixed(2) || '0,00'}</p>
                        </div>
                        <div>
                          <p><strong>Dias para Validade:</strong> {lote.diasParaValidade}</p>
                          <p><strong>Lucro Potencial:</strong> R$ {((product.precoVenda - lote.precoCusto) * lote.quantidade)?.toFixed(2) || '0,00'}</p>
                          <p><strong>Status:</strong> {lote.status || 'Ativo'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">Nenhum lote encontrado para este produto</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetailPage;