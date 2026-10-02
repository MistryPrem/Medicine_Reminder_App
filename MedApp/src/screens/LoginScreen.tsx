import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { THEME } from '../constants/theme';
import {
  CustomButton,
  CustomTextInput,
  CustomCard,
} from '../components/common';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      showToast({
        message: 'Please enter your email or phone number and password.',
        type: 'warning',
      });
      return;
    }

    try {
      await login(identifier.trim(), password);
      showToast({ message: 'Welcome back!', type: 'success' });
    } catch (error: any) {
      let message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';

      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const issues = error.response.data.details
          .map((d: { field: string; message: string }) => `• ${d.field}: ${d.message}`)
          .join('\n');
        message = `${message}\n\n${issues}`;
      }

      showToast({ message, type: 'error', duration: 4000 });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💊</Text>
          </View>
          <Text style={styles.appTitle}>MedApp</Text>
          <Text style={styles.subtitle}>Medicine Reminder & Adherence Assistant</Text>
        </View>

        {/* Login Card */}
        <CustomCard style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Access your schedules, alarms, and doses
          </Text>

          <CustomTextInput
            label="Email or Phone Number"
            placeholder="e.g. senior@example.com or 9876543210"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <CustomTextInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <CustomButton
            title="SIGN IN"
            onPress={handleLogin}
            isLoading={isLoading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </CustomCard>

        {/* Info Card */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Note: Senior accounts can be linked to caregivers via invite codes from the web dashboard or elderly settings.
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
    padding: THEME.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: THEME.radii.lg,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  appTitle: {
    ...THEME.typography.headerLarge,
    color: THEME.colors.primary,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    padding: 24,
  },
  cardTitle: {
    ...THEME.typography.headerMedium,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 8,
  },
  infoBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
  },
  infoText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
});
