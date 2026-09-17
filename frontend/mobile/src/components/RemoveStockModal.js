import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts, tabularNums } from '../theme/colors';
import { MOTIVOS_SAIDA } from '../utils/motivos';

// Lets the operator type or step to an exact quantity instead of tapping "-1"
// repeatedly. Always requires a motivo (backend rejects withdrawals without one).
const RemoveStockModal = ({ visible, product, onClose, onConfirm, busy }) => {
  const [quantity, setQuantity] = useState('1');
  const [motivo, setMotivo] = useState(null);

  useEffect(() => {
    if (visible) {
      setQuantity('1');
      setMotivo(null);
    }
  }, [visible, product?.id]);

  const max = product?.quantidadeTotal ?? 0;
  const qtyNum = parseInt(quantity, 10) || 0;
  const valid = qtyNum > 0 && qtyNum <= max && Boolean(motivo);

  const adjust = (delta) => {
    setQuantity((q) => {
      const next = (parseInt(q, 10) || 0) + delta;
      return String(Math.max(1, Math.min(max || 1, next)));
    });
  };

  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.eyebrow}>Remover estoque</Text>
              <Text style={styles.productName} numberOfLines={1}>{product.nome}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Quantidade (estoque atual: {max})</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity onPress={() => adjust(-1)} style={styles.stepBtn}>
              <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
            </TouchableOpacity>
            <TextInput
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={[styles.qtyInput, tabularNums]}
            />
            <TouchableOpacity onPress={() => adjust(1)} style={styles.stepBtn}>
              <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          {qtyNum > max && <Text style={styles.errorText}>Máximo disponível: {max}</Text>}

          <Text style={[styles.label, { marginTop: 16 }]}>Motivo</Text>
          <View style={styles.motivoGrid}>
            {MOTIVOS_SAIDA.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setMotivo(opt.value)}
                style={[styles.motivoChip, motivo === opt.value && styles.motivoChipActive]}
              >
                <Text style={[styles.motivoChipText, motivo === opt.value && styles.motivoChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => onConfirm(qtyNum, motivo)}
            disabled={!valid || busy}
            style={[styles.confirmBtn, (!valid || busy) && { opacity: 0.5 }]}
          >
            <Text style={styles.confirmText}>
              {busy ? 'Removendo...' : `Remover ${qtyNum || ''} unidade${qtyNum === 1 ? '' : 's'}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,39,36,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMutedLight,
  },
  productName: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.text,
    marginTop: 4,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMutedLight,
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.error,
    marginTop: 6,
  },
  motivoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  motivoChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  motivoChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  motivoChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  motivoChipTextActive: {
    color: colors.primaryLight,
  },
  confirmBtn: {
    marginTop: 20,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.primaryLight,
  },
});

export default RemoveStockModal;
