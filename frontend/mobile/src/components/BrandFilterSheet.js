import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Title } from 'react-native-paper';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// Bottom sheet with one chip per brand ("Todas" clears the filter). Opened from the parent through sheetRef.
const BrandFilterSheet = ({ sheetRef, marcas, selected, onSelect }) => {
  const { styles } = useThemedStyles(createStyles);
  const snapPoints = useMemo(() => ['40%'], []);
  const renderBackdrop = useCallback((p) => <BottomSheetBackdrop {...p} disappearsOnIndex={-1} appearsOnIndex={0} />, []);
  const pick = (marca) => {
    onSelect(marca);
    sheetRef.current?.close();
  };

  return (
    <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backdropComponent={renderBackdrop}>
      <BottomSheetView style={{ padding: 16 }}>
        <Title style={styles.title} accessibilityRole="header">Filtrar por Marca</Title>
        <View style={styles.chipRow}>
          <Chip selected={!selected} onPress={() => pick(null)} style={styles.chip}>
            Todas
          </Chip>
          {marcas.map((marca) => (
            <Chip key={marca} selected={selected === marca} onPress={() => pick(marca)} style={styles.chip}>
              {marca}
            </Chip>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    title: { fontFamily: fonts.sansMedium, color: colors.text, marginBottom: 12, fontSize: 18 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { marginRight: 8, marginBottom: 8 },
  });

export default BrandFilterSheet;
