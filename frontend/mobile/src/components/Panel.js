import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// The Figma dashboard card: white surface, hairline border, bold title + muted subtitle, optional action on the right.
const Panel = ({ title, subtitle, action, children, style }) => {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
};

export const PanelEmpty = ({ children }) => {
  const { styles } = useThemedStyles(createStyles);
  return <Text style={styles.empty}>{children}</Text>;
};

const createStyles = (colors) => StyleSheet.create({
  panel: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted, marginTop: 3 },
  empty: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMutedLight, textAlign: 'center', paddingVertical: 30 },
});

export default Panel;
