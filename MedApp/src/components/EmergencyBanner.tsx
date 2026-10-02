import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { THEME } from '../constants/theme';

interface EmergencyBannerProps {
  contactName?: string;
  phoneNumber?: string;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  contactName = 'Caregiver',
  phoneNumber,
}) => {
  if (!phoneNumber) return null;

  const handleCall = () => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Phone Call Not Supported', `Cannot place calls to ${phoneNumber} on this device.`);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error('Error opening phone dialer:', err));
  };

  return (
    <View style={styles.banner}>
      <View style={styles.info}>
        <Text style={styles.icon}>🚨</Text>
        <View style={styles.textContainer}>
          <Text style={styles.label}>EMERGENCY CAREGIVER CONTACT</Text>
          <Text style={styles.name}>{contactName}: {phoneNumber}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.callButton}
        onPress={handleCall}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Call emergency contact ${contactName}`}
      >
        <Text style={styles.callText}>CALL</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: THEME.colors.danger,
    borderRadius: THEME.radii.lg,
    padding: 14,
    marginBottom: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...THEME.shadows.card,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.danger,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.text,
    marginTop: 2,
  },
  callButton: {
    backgroundColor: THEME.colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textLight,
  },
});
