import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { THEME } from '../../constants/theme';

export interface CustomCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'subtle' | 'primary' | 'danger';
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  style,
  variant = 'surface',
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'subtle':
        return { backgroundColor: THEME.colors.surfaceSubtle };
      case 'primary':
        return {
          backgroundColor: THEME.colors.primaryLight,
          borderColor: THEME.colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: THEME.colors.dangerLight,
          borderColor: THEME.colors.danger,
        };
      default:
        return { backgroundColor: THEME.colors.surface };
    }
  };

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.card,
  },
});
