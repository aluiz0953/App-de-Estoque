import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import { decorative } from '../utils/a11y';

// High-use action with icon + title + description, per Tela 01 spec.
const QuickActionCard = ({ icon, title, description, onPress, style }) => {
  const { colors, styles } = useThemedStyles(createStyles);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.card, style]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
    >
      <MaterialCommunityIcons name={icon} size={20} color={colors.primaryDark} {...decorative} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors) => StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
    marginTop: 8,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
});

export default QuickActionCard;
