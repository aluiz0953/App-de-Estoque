import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigate } from '../hooks/useNavigate';
import { useToast } from '../components/Toast';
import ReasonMenu from '../components/ReasonMenu';
import apiService from '../services/api';
import { colors, fonts } from '../theme/colors';

const TIPOS_PRODUTO = ['Perfumaria', 'Cuidados Diários', 'Rosto e Proteção', 'Outros'].map((t) => ({
  value: t,
  label: t,
}));

const emptyForm = {
  nome: '',
  sku: '',
  descricao: '',
  marcaId: '',
  marcaNome: '',
  linhaId: '',
  linhaNome: '',
  tipoProduto: '',
  fragrancia: '',
  precoCusto: '',
  precoVenda: '',
  estoqueMinimo: '0',
};

// Tela 04 — Adicionar/Editar Produto. Editing never touches stock (spec rule);
// creating can optionally seed an initial lot, which needs the same lot fields
// EntradaRomaneio needs (numeroLote, dataValidade) because that's what the
// backend's /estoque/entrada endpoint actually requires — there's no simpler
// "just set quantidade" path in this data model.
const AddEditProductScreen = () => {
  const route = useRoute();
  const navigate = useNavigate();
  const showToast = useToast();
  const produtoId = route.params?.produtoId;
  const isEditMode = Boolean(produtoId);

  const [form, setForm] = useState(emptyForm);
  const [marcas, setMarcas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const [estoqueInicial, setEstoqueInicial] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [dataValidade, setDataValidade] = useState('');

  useEffect(() => {
    apiService.getMarcas().then(setMarcas).catch(() => setMarcas([]));
  }, []);

  useEffect(() => {
    if (!form.marcaId) {
      setLinhas([]);
      return;
    }
    apiService.getLinhas(form.marcaId).then(setLinhas).catch(() => setLinhas([]));
  }, [form.marcaId]);

  useEffect(() => {
    if (!isEditMode) return;
    apiService
      .getProductById(produtoId)
      .then((p) => {
        setForm({
          nome: p.nome || '',
          sku: p.sku || '',
          descricao: p.descricao || '',
          marcaId: p.linha?.marca?.id ? String(p.linha.marca.id) : '',
          marcaNome: p.linha?.marca?.nome || '',
          linhaId: p.linha?.id ? String(p.linha.id) : '',
          linhaNome: p.linha?.nome || '',
          tipoProduto: p.tipoProduto || '',
          fragrancia: p.fragrancia || '',
          precoCusto: p.precoCusto != null ? String(p.precoCusto) : '',
          precoVenda: p.precoVenda != null ? String(p.precoVenda) : '',
          estoqueMinimo: p.estoqueMinimo != null ? String(p.estoqueMinimo) : '0',
        });
      })
      .catch(() => showToast('Erro ao carregar produto'))
      .finally(() => setLoadingExisting(false));
  }, [isEditMode, produtoId]);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const isValid =
    form.nome.trim() &&
    form.sku.trim() &&
    form.linhaId &&
    form.tipoProduto &&
    form.fragrancia.trim() &&
    form.precoCusto !== '' &&
    form.precoVenda !== '';

  const initialStockValid =
    !estoqueInicial ||
    Number(estoqueInicial) <= 0 ||
    (numeroLote.trim() && /^\d{4}-\d{2}-\d{2}$/.test(dataValidade.trim()));

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    if (!isEditMode && !initialStockValid) {
      showToast('Informe lote e validade (AAAA-MM-DD) para o estoque inicial');
      return;
    }

    const payload = {
      sku: form.sku.trim(),
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      tipoProduto: form.tipoProduto,
      fragrancia: form.fragrancia.trim(),
      precoCusto: Number(form.precoCusto),
      precoVenda: Number(form.precoVenda),
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
      estoqueMaximo: 999999,
      linha: { id: Number(form.linhaId) },
    };

    setSaving(true);
    try {
      if (isEditMode) {
        await apiService.updateProduct(produtoId, payload);
        showToast('Produto atualizado');
      } else {
        const created = await apiService.createProduct(payload);
        const inicial = Number(estoqueInicial) || 0;
        if (inicial > 0) {
          await apiService.createStockEntry({
            produtoId: created.id,
            numeroLote: numeroLote.trim(),
            quantidade: inicial,
            dataValidade: dataValidade.trim(),
            precoCusto: Number(form.precoCusto),
            motivo: 'ESTOQUE_INICIAL',
          });
        }
        showToast('Produto adicionado');
      }
      navigate.goBack();
    } catch (e) {
      showToast(e.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{isEditMode ? 'Editar catálogo' : 'Novo item de catálogo'}</Text>
          <Text style={styles.title}>{isEditMode ? 'Refine os detalhes.' : 'Adicionar um novo perfume.'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigate.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Field label="Nome do produto">
          <TextInput value={form.nome} onChangeText={set('nome')} style={styles.input} placeholder="Ex: Cedar Bloom" />
        </Field>

        <FieldRow>
          <Field label="Marca" flex>
            <ReasonMenu
              options={marcas.map((m) => ({ value: String(m.id), label: m.nome }))}
              onSelect={(value) => {
                const marca = marcas.find((m) => String(m.id) === value);
                setForm((prev) => ({ ...prev, marcaId: value, marcaNome: marca?.nome || '', linhaId: '', linhaNome: '' }));
              }}
            >
              {({ open }) => (
                <TouchableOpacity onPress={open} style={styles.select}>
                  <Text style={styles.selectText}>{form.marcaNome || 'Selecionar'}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMutedLight} />
                </TouchableOpacity>
              )}
            </ReasonMenu>
          </Field>

          <Field label="Linha" flex>
            <ReasonMenu
              options={linhas.map((l) => ({ value: String(l.id), label: l.nome }))}
              onSelect={(value) => {
                const linha = linhas.find((l) => String(l.id) === value);
                setForm((prev) => ({ ...prev, linhaId: value, linhaNome: linha?.nome || '' }));
              }}
              disabled={!form.marcaId}
            >
              {({ open }) => (
                <TouchableOpacity onPress={open} disabled={!form.marcaId} style={[styles.select, !form.marcaId && styles.selectDisabled]}>
                  <Text style={styles.selectText}>{form.linhaNome || (form.marcaId ? 'Selecionar' : 'Escolha a marca')}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMutedLight} />
                </TouchableOpacity>
              )}
            </ReasonMenu>
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="SKU" flex>
            <TextInput value={form.sku} onChangeText={set('sku')} style={styles.input} autoCapitalize="characters" placeholder="MN-CB-50" />
          </Field>
          <Field label="Categoria" flex>
            <ReasonMenu options={TIPOS_PRODUTO} onSelect={set('tipoProduto')}>
              {({ open }) => (
                <TouchableOpacity onPress={open} style={styles.select}>
                  <Text style={styles.selectText}>{form.tipoProduto || 'Selecionar'}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMutedLight} />
                </TouchableOpacity>
              )}
            </ReasonMenu>
          </Field>
        </FieldRow>

        <Field label="Fragrância">
          <TextInput value={form.fragrancia} onChangeText={set('fragrancia')} style={styles.input} placeholder="Sandalwood · Iris · Cashmere" />
        </Field>

        <FieldRow>
          <Field label="Preço de venda" flex>
            <TextInput value={form.precoVenda} onChangeText={set('precoVenda')} keyboardType="decimal-pad" style={styles.input} />
          </Field>
          <Field label="Custo" flex>
            <TextInput value={form.precoCusto} onChangeText={set('precoCusto')} keyboardType="decimal-pad" style={styles.input} />
          </Field>
        </FieldRow>

        <Field label="Descrição">
          <TextInput
            value={form.descricao}
            onChangeText={set('descricao')}
            style={[styles.input, { height: 70 }]}
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Field label="Estoque mínimo">
          <TextInput value={form.estoqueMinimo} onChangeText={set('estoqueMinimo')} keyboardType="number-pad" style={styles.input} />
        </Field>

        {!isEditMode && (
          <>
            <Text style={styles.sectionLabel}>Estoque inicial (opcional)</Text>
            <FieldRow>
              <Field label="Quantidade" flex>
                <TextInput value={estoqueInicial} onChangeText={setEstoqueInicial} keyboardType="number-pad" style={styles.input} />
              </Field>
              <Field label="Número do lote" flex>
                <TextInput value={numeroLote} onChangeText={setNumeroLote} style={styles.input} />
              </Field>
            </FieldRow>
            <Field label="Validade (AAAA-MM-DD)">
              <TextInput value={dataValidade} onChangeText={setDataValidade} style={styles.input} placeholder="2027-03-15" />
            </Field>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigate.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isValid || saving}
          style={[styles.saveBtn, (!isValid || saving) && { opacity: 0.5 }]}
        >
          <Text style={styles.saveText}>
            {saving ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Adicionar produto'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Field = ({ label, children, flex }) => (
  <View style={[styles.field, flex && { flex: 1 }]}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const FieldRow = ({ children }) => <View style={styles.fieldRow}>{children}</View>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMutedLight,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    marginTop: 6,
    maxWidth: 260,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { padding: 20, gap: 14 },
  field: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMutedLight,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text,
  },
  select: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectDisabled: { opacity: 0.5 },
  selectText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMutedLight,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.primaryLight,
  },
});

export default AddEditProductScreen;
