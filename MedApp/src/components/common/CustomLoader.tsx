import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';

export interface CustomLoaderProps {
  message?: string;
  fullscreen?: boolean;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({
  message = 'Loading...',
  fullscreen = false,
}) => {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        {message ? <Text style={styles.text}>{message}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: THEME.colors.overlay,
    zIndex: 999,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: THEME.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...THEME.shadows.modal,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
  },
});
