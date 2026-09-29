import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// status: 'synced' | 'syncing' | 'stale' | 'offline'
const STATUS = {
  synced: { dot: 'success', label: 'Sincronizado agora' },
  syncing: { dot: 'secondaryDark', label: 'Sincronizando...' },
  stale: { dot: 'warning', label: 'Sincronização atrasada' },
  offline: { dot: 'error', label: 'Sem conexão' },
};

const SyncIndicator = ({ status = 'synced', label, onRetry, style }) => {
  const { colors, styles } = useThemedStyles(createStyles);
  const tone = STATUS[status] || STATUS.synced;
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.dot, { backgroundColor: colors[tone.dot] }]} />
      <Text style={styles.label}>{label || tone.label}</Text>
      {(status === 'stale' || status === 'offline') && onRetry ? (
        <TouchableOpacity onPress={onRetry} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <MaterialCommunityIcons name="refresh" size={13} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
});

export default SyncIndicator;
