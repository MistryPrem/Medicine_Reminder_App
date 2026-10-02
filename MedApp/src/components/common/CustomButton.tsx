import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import { THEME } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface CustomButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel
}) => {
  const isInteractive = !disabled && !isLoading;

  const getContainerStyle = (): StyleProp<ViewStyle> => {
    const base: ViewStyle[] = [styles.base, styles[`size_${size}`]];

    switch (variant) {
      case 'primary':
        base.push(styles.variantPrimary);
        break;
      case 'secondary':
        base.push(styles.variantSecondary);
        break;
      case 'danger':
        base.push(styles.variantDanger);
        break;
      case 'success':
        base.push(styles.variantSuccess);
        break;
      case 'outline':
        base.push(styles.variantOutline);
        break;
      case 'ghost':
        base.push(styles.variantGhost);
        break;
    }

    if (!isInteractive) {
      base.push(styles.disabled);
    }

    return [base, style];
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const base: TextStyle[] = [styles.baseText, styles[`textSize_${size}`]];

    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        base.push(styles.textWhite);
        break;
      case 'secondary':
        base.push(styles.textWhite);
        break;
      case 'outline':
        base.push(styles.textPrimary);
        break;
      case 'ghost':
        base.push(styles.textSecondary);
        break;
    }

    if (disabled) {
      base.push(styles.textDisabled);
    }

    return [base, textStyle];
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={isInteractive ? onPress : undefined}
      style={getContainerStyle()}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {isLoading ? (
        <ActivityIndicator
          size={size === 'lg' ? 'small' : 16}
          color={variant === 'outline' || variant === 'ghost' ? THEME.colors.primary : THEME.colors.textLight}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radii.md,
    gap: THEME.spacing.sm,
  },
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
  },
  variantPrimary: {
    backgroundColor: THEME.colors.primary,
  },
  variantSecondary: {
    backgroundColor: THEME.colors.secondary,
  },
  variantDanger: {
    backgroundColor: THEME.colors.danger,
  },
  variantSuccess: {
    backgroundColor: THEME.colors.success,
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  textWhite: {
    color: THEME.colors.textLight,
  },
  textPrimary: {
    color: THEME.colors.primary,
  },
  textSecondary: {
    color: THEME.colors.textSecondary,
  },
  disabled: {
    opacity: 0.55,
  },
  textDisabled: {
    color: THEME.colors.textMuted,
  },
});
