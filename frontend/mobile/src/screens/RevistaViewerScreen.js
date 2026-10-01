import React, { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigate } from '../hooks/useNavigate';
import RevistaImagem from '../components/RevistaImagem';
import { fonts, tabularNums } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { decorative, slopFor } from '../utils/a11y';

const { width: SCREEN_W } = Dimensions.get('window');
const keyExtractor = (n) => String(n);
const getItemLayout = (_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index });

// One magazine, one page per screen: swipe sideways (or use the arrows) to turn pages.
const RevistaViewerScreen = ({ route }) => {
  const { revista } = route.params;
  const { colors, styles } = useThemedStyles(createStyles);
  const navigate = useNavigate();
  const listRef = useRef(null);
  const [pagina, setPagina] = useState(1);
  const pages = React.useMemo(() => Array.from({ length: revista.totalPaginas }, (_, i) => i + 1), [revista.totalPaginas]);

  const goTo = useCallback(
    (n) => {
      const next = Math.min(revista.totalPaginas, Math.max(1, n));
      listRef.current?.scrollToIndex({ index: next - 1, animated: true });
      setPagina(next);
    },
    [revista.totalPaginas]
  );

  const onScrollEnd = (event) => setPagina(Math.round(event.nativeEvent.contentOffset.x / SCREEN_W) + 1);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.pageBox}>
        <RevistaImagem
          path={`${revista.id}/paginas/${item}`}
          style={styles.page}
          resizeMode="contain"
          label={`${revista.titulo}, página ${item} de ${revista.totalPaginas}`}
        />
      </View>
    ),
    [revista, styles]
  );

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
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow} numberOfLines={1}>{revista.marcaNome.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{revista.titulo}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        onMomentumScrollEnd={onScrollEnd}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => goTo(pagina - 1)}
          disabled={pagina <= 1}
          style={[styles.navBtn, pagina <= 1 && styles.navBtnOff]}
          accessibilityRole="button"
          accessibilityLabel="Página anterior"
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} {...decorative} />
        </TouchableOpacity>
        <Text style={[styles.counter, tabularNums]} accessibilityLiveRegion="polite">
          {pagina} / {revista.totalPaginas}
        </Text>
        <TouchableOpacity
          onPress={() => goTo(pagina + 1)}
          disabled={pagina >= revista.totalPaginas}
          style={[styles.navBtn, pagina >= revista.totalPaginas && styles.navBtnOff]}
          accessibilityRole="button"
          accessibilityLabel="Próxima página"
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} {...decorative} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  topHeader: {
    backgroundColor: colors.headerBg,
    paddingVertical: 16,
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
    fontSize: 20,
    marginTop: 4,
  },
  pageBox: { width: SCREEN_W, padding: 12, justifyContent: 'center' },
  page: { width: '100%', height: '100%', borderRadius: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnOff: { opacity: 0.35 },
  counter: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted },
});

export default RevistaViewerScreen;
