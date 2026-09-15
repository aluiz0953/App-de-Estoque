import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Title, Paragraph, List, Button, TextInput, Switch } from 'react-native-paper';
import { createProduct, updateProduct, fetchProductById } from '../store/slices/inventorySlice';
import { useFetchProductById } from '../hooks/useFetchProductById';

const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditMode, setIsEditMode] = useState(!!id);

  // Form state
  const [form, setForm] = useState({
    sku: '',
    nome: '',
    descricao: '',
    linhaId: '',
    marcaId: '', // This would normally come from a dropdown of marcas
    precoCusto: '',
    precoVenda: '',
    estoqueMinimo: '',
    estoqueMaximo: '',
    ativo: true
  });

  // Handle form changes
  const handleChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load product data if editing
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await dispatch(fetchProductById(id)).unwrap();
          setForm({
            sku: response.sku || '',
            nome: response.nome || '',
            descricao: response.descricao || '',
            linhaId: response.linha?.id || '',
            marcaId: response.linha?.marca?.id || '',
            precoCusto: response.precoCusto ? response.precoCusto.toString() : '',
            precoVenda: response.precoVenda ? response.precoVenda.toString() : '',
            estoqueMinimo: response.estoqueMinimo ? response.estoqueMinimo.toString() : '',
            estoqueMaximo: response.estoqueMaximo ? response.estoqueMaximo.toString() : '',
            ativo: response.ativo !== undefined ? response.ativo : true
          });
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      };

      fetchProduct();
    }
  }, [id, dispatch]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!form.sku || !form.nome || !form.linhaId || !form.precoCusto || !form.precoVenda) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (isEditMode && id) {
        await dispatch(updateProduct(id, form)).unwrap();
        alert('Produto atualizado com sucesso!');
      } else {
        await dispatch(createProduct(form)).unwrap();
        alert('Produto criado com sucesso!');
      }
      navigate('/estoque');
    } catch (error) {
      alert('Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
    }
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Editar Produto' : 'Criar Novo Produto'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* SKU and Nome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <TextInput
                  value={form.sku}
                  onChangeText={(value) => handleChange('sku', value)}
                  placeholder="Digite o SKU do produto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <TextInput
                  value={form.nome}
                  onChangeText={(value) => handleChange('nome', value)}
                  placeholder="Digite o nome do produto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <TextInput
                value={form.descricao}
                onChangeText={(value) => handleChange('descricao', value)}
                placeholder="Digite a descrição do produto"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Linha and Marca (simplified - in real app would use dropdowns/API calls) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Linha ID *
                </label>
                <TextInput
                  value={form.linhaId}
                  onChangeText={(value) => handleChange('linhaId', value)}
                  placeholder="Digite o ID da linha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca ID
                </label>
                <TextInput
                  value={form.marcaId}
                  onChangeText={(value) => handleChange('marcaId', value)}
                  placeholder="Digite o ID da marca (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Custo (R$) *
                </label>
                <TextInput
                  value={form.precoCusto}
                  onChangeText={(value) => handleChange('precoCusto', value)}
                  placeholder="0,00"
                  keyboardType="numeric"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Venda (R$) *
                </label>
                <TextInput
                  value={form.precoVenda}
                  onChangeText={(value) => handleChange('precoVenda', value)}
                  placeholder="0,00"
                  keyboardType="numeric"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Estoque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque Mínimo
                </label>
                <TextInput
                  value={form.estoqueMinimo}
                  onChangeText={(value) => handleChange('estoqueMinimo', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque Máximo
                </label>
                <TextInput
                  value={form.estoqueMaximo}
                  onChangeText={(value) => handleChange('estoqueMaximo', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-3">
              <Switch
                status={form.ativo ? 'checked' : 'unchecked'}
                onValueChange={(value) => handleChange('ativo', value)}
                color="#5B2C6F"
              />
              <label className="text-sm font-medium text-gray-700">
                Produto Ativo
              </label>
            </div>
          </div>

          <div className="pt-4">
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={isEditMode ? false : !(form.sku && form.nome && form.linhaId && form.precoCusto && form.precoVenda)}
            >
              {isEditMode ? 'Atualizar Produto' : 'Criar Produto'}
            </Button>
            <Button
              mode="text"
              onPress={() => navigate(-1)}
              className="ml-3"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProductFormPage;