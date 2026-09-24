import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { THEME } from '../constants/theme';

interface EmergencyBannerProps {
  caregiverName?: string;
  caregiverPhone?: string;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  caregiverName,
  caregiverPhone,
}) => {
  const handleCall = () => {
    if (!caregiverPhone) {
      Alert.alert('No Phone Number', 'No caregiver contact phone number is set.');
      return;
    }

    const url = `tel:${caregiverPhone}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Phone call is not supported on this device.');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => Alert.alert('Error', err.message));
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoCol}>
        <Text style={styles.title}>EMERGENCY ASSISTANCE</Text>
        <Text style={styles.subtitle}>
          {caregiverName ? `Caregiver: ${caregiverName}` : 'Call Primary Contact'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.callButton}
        onPress={handleCall}
        accessibilityRole="button"
        accessibilityLabel={`Call caregiver ${caregiverName || ''}`}
      >
        <Text style={styles.callIcon}>📞</Text>
        <Text style={styles.callText}>CALL</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#450a0a',
    borderWidth: 2,
    borderColor: THEME.colors.danger,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
  },
  infoCol: {
    flex: 1,
    paddingRight: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.bold,
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.medium,
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  callButton: {
    backgroundColor: THEME.colors.danger,
    minHeight: THEME.touchTarget.minHeight,
    paddingHorizontal: 20,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callIcon: {
    fontSize: 20,
    color: THEME.colors.textLight,
  },
  callText: {
    color: THEME.colors.textLight,
    fontWeight: THEME.typography.weights.bold,
    fontSize: THEME.typography.sizes.md,
  },
});
