import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { checkForUpdate } from '../services/updates';

const DISMISSED_KEY = 'update.dismissed';

// Shown on the Painel when GitHub has a newer release. "Depois" hides it until the next version comes out.
const UpdateBanner = () => {
  const { styles } = useThemedStyles(createStyles);
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const found = await checkForUpdate();
      if (!found || !alive) return;
      const dismissed = await AsyncStorage.getItem(DISMISSED_KEY).catch(() => null);
      if (dismissed !== found.version) setUpdate(found);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!update) return null;

  const later = () => {
    AsyncStorage.setItem(DISMISSED_KEY, update.version).catch(() => {});
    setUpdate(null);
  };

  return (
    <View style={styles.banner} accessibilityRole="summary">
      <Text style={styles.title}>Versão {update.version} disponível</Text>
      <Text style={styles.text}>Baixe o arquivo e toque em Instalar. Seus dados continuam no aparelho.</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={later} style={styles.quiet} accessibilityRole="button" accessibilityLabel="Lembrar depois">
          <Text style={styles.quietText}>Depois</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL(update.url)}
          style={styles.primary}
          accessibilityRole="button"
          accessibilityLabel={`Baixar a versão ${update.version}`}
        >
          <Text style={styles.primaryText}>Baixar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  banner: { marginTop: 14, borderWidth: 1.5, borderColor: colors.primaryDark, borderRadius: 6, padding: 14, backgroundColor: colors.surface },
  title: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  text: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  quiet: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
  quietText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textMuted },
  primary: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 22, borderRadius: 6, backgroundColor: colors.primary },
  primaryText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primaryLight },
});

export default UpdateBanner;
