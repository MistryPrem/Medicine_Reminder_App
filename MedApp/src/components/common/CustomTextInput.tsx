import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import { THEME } from '../../constants/theme';

export interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  isPassword?: boolean;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  isPassword = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={THEME.colors.textMuted}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.iconSlot}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.iconSlot}>{rightIcon}</View>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: THEME.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: THEME.colors.borderFocus,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: THEME.colors.danger,
    backgroundColor: '#fff5f5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: THEME.colors.text,
    paddingVertical: 12,
  },
  iconSlot: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.danger,
    marginTop: 4,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});
