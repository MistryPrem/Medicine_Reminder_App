import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';

interface OfflineSyncBannerProps {
  queueCount: number;
  onSyncNow: () => void;
  isSyncing?: boolean;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  queueCount,
  onSyncNow,
  isSyncing = false,
}) => {
  if (queueCount === 0) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Offline Queue Active</Text>
          <Text style={styles.subtitle}>
            {queueCount} {queueCount === 1 ? 'action pending' : 'actions pending'} sync
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.syncBtn}
        onPress={onSyncNow}
        disabled={isSyncing}
        activeOpacity={0.8}
      >
        <Text style={styles.syncText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: THEME.colors.warningLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.warning,
    borderRadius: THEME.radii.md,
    padding: 12,
    marginBottom: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350f',
  },
  subtitle: {
    fontSize: 12,
    color: '#92400e',
  },
  syncBtn: {
    backgroundColor: THEME.colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.sm,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
