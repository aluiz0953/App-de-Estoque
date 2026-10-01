import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import apiService from '../services/api';
import { useNavigate } from '../hooks/useNavigate';
import { LIST_PERF_PROPS } from '../utils/listPerf';
import RevistaImagem from '../components/RevistaImagem';
import SkeletonList from '../components/SkeletonList';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { decorative, slopFor } from '../utils/a11y';

const GAP = 14;
const PADDING = 16;
const CARD_W = (Dimensions.get('window').width - PADDING * 2 - GAP) / 2;

const keyExtractor = (item) => item.id.toString();

// Magazine shelf: each brand's magazines as covers with their names; tapping one opens the page-by-page reader.
const RevistasScreen = () => {
  const { colors, styles } = useThemedStyles(createStyles);
  const navigate = useNavigate();
  const [revistas, setRevistas] = useState([]);
  const [marca, setMarca] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(() => {
    return apiService
      .getRevistas()
      .then((data) => {
        setRevistas(data);
        setError(null);
      })
      .catch(setError)
      .finally(() => {
        setIsLoading(false);
        hasLoadedOnce.current = true;
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const marcas = useMemo(() => [...new Set(revistas.map((r) => r.marcaNome))], [revistas]);
  const visible = marca ? revistas.filter((r) => r.marcaNome === marca) : revistas;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigate.goBack()}
          hitSlop={slopFor(24)}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.headerInk} {...decorative} />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>REVISTAS</Text>
          <Text style={styles.title} accessibilityRole="header">Revistas das marcas</Text>
        </View>
      </View>

      {marcas.length > 1 && (
        <View style={styles.chipsRow}>
          {[null, ...marcas].map((nome) => (
            <TouchableOpacity
              key={nome || 'todas'}
              onPress={() => setMarca(nome)}
              style={[styles.chip, marca === nome && styles.chipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Mostrar revistas: ${nome || 'Todas'}`}
              accessibilityState={{ selected: marca === nome }}
            >
              <Text style={[styles.chipText, marca === nome && styles.chipTextActive]}>{nome || 'Todas'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.error }}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ padding: PADDING, gap: GAP }}
          {...LIST_PERF_PROPS}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ width: CARD_W }}
              onPress={() => navigate('RevistaViewer', { revista: item })}
              accessibilityRole="button"
              accessibilityLabel={`${item.titulo}, ${item.marcaNome}, ${item.totalPaginas} páginas`}
              accessibilityHint="Toque duas vezes para ler a revista"
            >
              <RevistaImagem path={`${item.id}/capa`} style={styles.cover} label={`Capa de ${item.titulo}`} />
              <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{item.marcaNome} · {item.totalPaginas} páginas</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={48} color={colors.disabled} {...decorative} />
              <Text style={{ marginTop: 16, color: colors.textMuted, textAlign: 'center' }}>
                Nenhuma revista ainda. O PDF é enviado pela versão web.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  topHeader: {
    backgroundColor: colors.headerBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: { marginLeft: -6 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.headerInk,
    opacity: 0.65,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.headerInk,
    fontSize: 22,
    marginTop: 4,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: PADDING, paddingTop: 12 },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textMuted },
  chipTextActive: { color: colors.primaryLight },
  cover: {
    width: CARD_W,
    height: CARD_W * (4 / 3),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTitle: { marginTop: 8, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.text },
  cardMeta: { marginTop: 2, fontFamily: fonts.sans, fontSize: 11, color: colors.textMutedLight },
});

export default RevistasScreen;
