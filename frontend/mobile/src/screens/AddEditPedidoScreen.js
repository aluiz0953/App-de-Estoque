import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigate } from '../hooks/useNavigate';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import { colors, fonts, tabularNums } from '../theme/colors';

const money = (v) => `R$ ${(v ?? 0).toFixed(2)}`;

// Tela de Adicionar Pedido — cliente (busca + criação rápida inline) + itens
// (busca de produto + quantidade), mesmo padrão de busca já usado em
// EntradaRomaneioScreen/HistoryScreen.
const AddEditPedidoScreen = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteResults, setClienteResults] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ nome: '', telefone: '', email: '' });
  const clienteDebounce = useRef(null);

  const [produtoSearch, setProdutoSearch] = useState('');
  const [produtoResults, setProdutoResults] = useState([]);
  const [itens, setItens] = useState([]);
  const produtoDebounce = useRef(null);

  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clienteDebounce.current) clearTimeout(clienteDebounce.current);
    if (clienteSearch.trim().length < 2) {
      setClienteResults([]);
      return;
    }
    clienteDebounce.current = setTimeout(() => {
      apiService.getClientes({ search: clienteSearch.trim() }).then((r) => setClienteResults((r || []).slice(0, 6)));
    }, 300);
    return () => clearTimeout(clienteDebounce.current);
  }, [clienteSearch]);

  useEffect(() => {
    if (produtoDebounce.current) clearTimeout(produtoDebounce.current);
    if (produtoSearch.trim().length < 2) {
      setProdutoResults([]);
      return;
    }
    produtoDebounce.current = setTimeout(() => {
      apiService.getProducts({ search: produtoSearch.trim() }).then((r) => setProdutoResults((r || []).slice(0, 6)));
    }, 300);
    return () => clearTimeout(produtoDebounce.current);
  }, [produtoSearch]);

  const addItem = (produto) => {
    setItens((prev) => {
      const existing = prev.find((i) => i.produtoId === produto.id);
      if (existing) {
        return prev.map((i) => (i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { produtoId: produto.id, nome: produto.nome, sku: produto.sku, precoVenda: produto.precoVenda, quantidade: 1 }];
    });
    setProdutoSearch('');
    setProdutoResults([]);
  };

  const updateQuantidade = (produtoId, text) => {
    const qty = Math.max(1, parseInt(text.replace(/[^0-9]/g, ''), 10) || 1);
    setItens((prev) => prev.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: qty } : i)));
  };

  const removeItem = (produtoId) => setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));

  const total = itens.reduce((sum, i) => sum + i.precoVenda * i.quantidade, 0);
  const isValid = (selectedCliente || newCliente.nome.trim()) && itens.length > 0;

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      let clienteId = selectedCliente?.id;
      if (!clienteId) {
        const created = await apiService.createCliente(newCliente);
        clienteId = created.id;
      }
      const result = await apiService.createPedido({
        clienteId,
        observacoes,
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      });
      showToast('Pedido criado');
      navigate('PedidoDetail', { pedidoId: result.id });
    } catch (e) {
      showToast(e.message || 'Erro ao criar pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Novo pedido</Text>
          <Text style={styles.title}>Registrar venda.</Text>
        </View>
        <TouchableOpacity onPress={() => navigate.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.sectionLabel}>Cliente</Text>
        {selectedCliente ? (
          <View style={styles.selectedCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{selectedCliente.nome}</Text>
              <Text style={styles.selectedMeta}>{selectedCliente.telefone || selectedCliente.email}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedCliente(null)}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : showNewCliente ? (
          <View style={styles.newClienteBox}>
            <TextInput
              value={newCliente.nome}
              onChangeText={(t) => setNewCliente({ ...newCliente, nome: t })}
              placeholder="Nome"
              style={styles.input}
            />
            <TextInput
              value={newCliente.telefone}
              onChangeText={(t) => setNewCliente({ ...newCliente, telefone: t })}
              placeholder="Telefone"
              style={[styles.input, { marginTop: 8 }]}
            />
            <TextInput
              value={newCliente.email}
              onChangeText={(t) => setNewCliente({ ...newCliente, email: t })}
              placeholder="E-mail"
              style={[styles.input, { marginTop: 8 }]}
            />
            <TouchableOpacity onPress={() => setShowNewCliente(false)} style={{ marginTop: 8 }}>
              <Text style={styles.linkText}>Buscar cliente existente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              value={clienteSearch}
              onChangeText={setClienteSearch}
              placeholder="Buscar cliente por nome..."
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowNewCliente(true)} style={{ marginTop: 8 }}>
              <Text style={styles.linkText}>+ Novo cliente</Text>
            </TouchableOpacity>
            {clienteResults.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.resultRow}
                onPress={() => { setSelectedCliente(c); setClienteResults([]); setClienteSearch(''); }}
              >
                <Text>{c.nome} {c.telefone ? `· ${c.telefone}` : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Itens</Text>
        <TextInput
          value={produtoSearch}
          onChangeText={setProdutoSearch}
          placeholder="Buscar produto por nome ou SKU..."
          style={styles.input}
        />
        {produtoResults.map((p) => (
          <TouchableOpacity key={p.id} style={styles.resultRow} onPress={() => addItem(p)}>
            <Text style={{ flex: 1 }} numberOfLines={1}>{p.nome} · {p.sku}</Text>
            <Text style={tabularNums}>{money(p.precoVenda)}</Text>
          </TouchableOpacity>
        ))}

        {itens.length > 0 && (
          <View style={styles.itensBox}>
            {itens.map((item) => (
              <View key={item.produtoId} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.nome}</Text>
                  <Text style={styles.itemMeta}>{item.sku} · {money(item.precoVenda)}/un.</Text>
                </View>
                <TextInput
                  value={String(item.quantidade)}
                  onChangeText={(t) => updateQuantidade(item.produtoId, t)}
                  keyboardType="number-pad"
                  style={styles.qtyInput}
                />
                <Text style={[styles.itemTotal, tabularNums]}>{money(item.precoVenda * item.quantidade)}</Text>
                <TouchableOpacity onPress={() => removeItem(item.produtoId)}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, tabularNums]}>{money(total)}</Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Observações (opcional)</Text>
        <TextInput
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          style={[styles.input, { height: 70 }]}
        />
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
          <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Criar pedido'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
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
  form: { padding: 20 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMutedLight,
    marginBottom: 8,
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
  linkText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.secondaryDark,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
    backgroundColor: colors.background,
    padding: 12,
  },
  selectedName: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  selectedMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  newClienteBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 12,
  },
  itensBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.text,
  },
  itemMeta: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textMutedLight,
    marginTop: 2,
  },
  qtyInput: {
    width: 44,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
  },
  itemTotal: {
    width: 64,
    textAlign: 'right',
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 12,
  },
  totalLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  totalValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
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

export default AddEditPedidoScreen;
