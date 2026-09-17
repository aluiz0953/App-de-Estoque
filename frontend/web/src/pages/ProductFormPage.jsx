import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, updateProduct } from '../store/slices/inventorySlice';
import { useFetchProductById } from '../hooks/useFetchProductById';
import apiService from '../services/api';

const TIPOS_PRODUTO = ['Perfumaria', 'Cuidados Diários', 'Rosto e Proteção', 'Outros'];

const emptyForm = {
  nome: '',
  sku: '',
  descricao: '',
  marcaId: '',
  linhaId: '',
  tipoProduto: '',
  fragrancia: '',
  precoCusto: '',
  precoVenda: '',
  estoqueMinimo: 0,
  estoqueMaximo: 999999,
  ativo: true,
};

const ProductFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: existingProduct, isLoading: isLoadingProduct } = useFetchProductById(id);

  const [form, setForm] = useState(emptyForm);
  const [marcas, setMarcas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    apiService.getMarcas().then(setMarcas).catch(() => setMarcas([]));
  }, []);

  useEffect(() => {
    if (existingProduct) {
      setForm({
        nome: existingProduct.nome || '',
        sku: existingProduct.sku || '',
        descricao: existingProduct.descricao || '',
        marcaId: existingProduct.linha?.marca?.id ? String(existingProduct.linha.marca.id) : '',
        linhaId: existingProduct.linha?.id ? String(existingProduct.linha.id) : '',
        tipoProduto: existingProduct.tipoProduto || '',
        fragrancia: existingProduct.fragrancia || '',
        precoCusto: existingProduct.precoCusto ?? '',
        precoVenda: existingProduct.precoVenda ?? '',
        estoqueMinimo: existingProduct.estoqueMinimo ?? 0,
        estoqueMaximo: existingProduct.estoqueMaximo ?? 999999,
        ativo: existingProduct.active ?? true,
      });
    }
  }, [existingProduct]);

  useEffect(() => {
    if (!form.marcaId) {
      setLinhas([]);
      return;
    }
    apiService.getLinhas(form.marcaId).then(setLinhas).catch(() => setLinhas([]));
  }, [form.marcaId]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleMarcaChange = (marcaId) => setForm((prev) => ({ ...prev, marcaId, linhaId: '' }));

  const isValid =
    form.sku && form.nome && form.linhaId && form.precoCusto !== '' && form.precoVenda !== '' && form.tipoProduto && form.fragrancia;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditMode && !isValid) return;

    const payload = {
      sku: form.sku,
      nome: form.nome,
      descricao: form.descricao,
      tipoProduto: form.tipoProduto,
      fragrancia: form.fragrancia,
      precoCusto: Number(form.precoCusto),
      precoVenda: Number(form.precoVenda),
      estoqueMinimo: Number(form.estoqueMinimo),
      estoqueMaximo: Number(form.estoqueMaximo),
      active: form.ativo,
      linha: form.linhaId ? { id: Number(form.linhaId) } : undefined,
    };

    setIsSaving(true);
    setSaveError(null);
    try {
      if (isEditMode) {
        const result = await dispatch(updateProduct({ id, ...payload })).unwrap();
        navigate(`/produtos/${result.id}`);
      } else {
        const result = await dispatch(createProduct(payload)).unwrap();
        navigate(`/produtos/${result.id}`);
      }
    } catch (err) {
      setSaveError(err?.message || err || 'Erro ao salvar produto');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditMode && isLoadingProduct) {
    return (
      <main className="p-5 md:p-9">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-dark" />
          <p className="mt-4 text-[12px] text-muted-light">Carregando produto...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-5 md:p-9">
      <div className="mb-8">
        <p className="eyebrow">{isEditMode ? 'Editar item do catálogo' : 'Novo item do catálogo'}</p>
        <h2 className="font-display mt-3 text-[34px] tracking-[-0.03em] md:text-[40px]">
          {isEditMode ? 'Refine os detalhes.' : 'Cadastre um novo produto.'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl rounded-xl border border-border bg-surface p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do produto">
            <input value={form.nome} onChange={(e) => handleChange('nome', e.target.value)} placeholder="Ex: Kaiak Tradicional" />
          </Field>
          <Field label="SKU">
            <input value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} placeholder="NAT-KK-100" />
          </Field>

          <Field label="Marca">
            <select value={form.marcaId} onChange={(e) => handleMarcaChange(e.target.value)}>
              <option value="">Selecione a marca</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Linha">
            <select value={form.linhaId} onChange={(e) => handleChange('linhaId', e.target.value)} disabled={!form.marcaId}>
              <option value="">{form.marcaId ? 'Selecione a linha' : 'Selecione a marca primeiro'}</option>
              {linhas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tipo de produto">
            <select value={form.tipoProduto} onChange={(e) => handleChange('tipoProduto', e.target.value)}>
              <option value="">Selecione o tipo</option>
              {TIPOS_PRODUTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fragrância">
            <input value={form.fragrancia} onChange={(e) => handleChange('fragrancia', e.target.value)} placeholder="Ex: Kaiak Tradicional" />
          </Field>

          <Field label="Preço de custo">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.precoCusto}
              onChange={(e) => handleChange('precoCusto', e.target.value)}
            />
          </Field>
          <Field label="Preço de venda">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.precoVenda}
              onChange={(e) => handleChange('precoVenda', e.target.value)}
            />
          </Field>

          <Field label="Estoque mínimo">
            <input type="number" min="0" value={form.estoqueMinimo} onChange={(e) => handleChange('estoqueMinimo', e.target.value)} />
          </Field>
          <Field label="Estoque máximo">
            <input type="number" min="0" value={form.estoqueMaximo} onChange={(e) => handleChange('estoqueMaximo', e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Descrição">
            <textarea
              value={form.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              rows={3}
              placeholder="Descrição do produto"
            />
          </Field>
        </div>

        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => handleChange('ativo', e.target.checked)}
            className="h-4 w-4 rounded border-border accent-secondary-dark"
          />
          <span className="text-[13px] text-ink">Produto ativo</span>
        </label>

        {saveError && <p className="mt-4 text-[13px] text-danger">{String(saveError)}</p>}

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
          <button type="button" onClick={() => navigate(-1)} className="rounded-full border border-border px-5 py-2.5 text-[12px] text-muted">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || (!isEditMode && !isValid)}
            className="pressable rounded-full bg-primary px-5 py-2.5 text-[12px] text-primary-50 transition hover:bg-primary-dark disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Criar produto'}
          </button>
        </div>
      </form>
    </main>
  );
};

const Field = ({ label, children }) => (
  <label className="grid gap-2">
    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-light">{label}</span>
    <span className="[&>input]:h-10 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-border [&>input]:bg-brand-bg [&>input]:px-3 [&>input]:text-[12px] [&>input]:outline-none [&>input]:focus:border-secondary-dark [&>select]:h-10 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-border [&>select]:bg-brand-bg [&>select]:px-3 [&>select]:text-[12px] [&>select]:outline-none [&>select]:focus:border-secondary-dark [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-border [&>textarea]:bg-brand-bg [&>textarea]:px-3 [&>textarea]:py-2 [&>textarea]:text-[12px] [&>textarea]:outline-none [&>textarea]:focus:border-secondary-dark">
      {children}
    </span>
  </label>
);

export default ProductFormPage;
