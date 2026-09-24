import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../constants/theme';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email or phone number and password.');
      return;
    }

    try {
      await login(identifier.trim(), password);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoIcon}>💊</Text>
          <Text style={styles.appTitle}>MedReminder</Text>
          <Text style={styles.subtitle}>Senior & Caregiver Medicine Assistant</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Email or Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. senior@example.com"
            placeholderTextColor="#94a3b8"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
          >
            {isLoading ? (
              <ActivityIndicator color={THEME.colors.textLight} />
            ) : (
              <Text style={styles.loginBtnText}>SIGN IN</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Need assistance? Ask your designated caregiver to help pair your account.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  logoIcon: {
    fontSize: 56,
    marginBottom: THEME.spacing.xs,
  },
  appTitle: {
    fontSize: THEME.typography.sizes.xxl,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.primary,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.md,
    color: THEME.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.semibold,
    color: THEME.colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    minHeight: THEME.touchTarget.minHeight,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    fontSize: THEME.typography.sizes.md,
    color: THEME.colors.textPrimary,
    backgroundColor: THEME.colors.surfaceElevated,
  },
  loginButton: {
    backgroundColor: THEME.colors.primary,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
  },
  loginBtnText: {
    color: '#090d16',
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.bold,
    letterSpacing: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  infoBox: {
    marginTop: THEME.spacing.xl,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.md,
  },
  infoText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
