import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { THEME } from '../constants/theme';

interface OfflineSyncBannerProps {
  pendingCount: number;
  isSyncing: boolean;
  onSyncPress: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  pendingCount,
  isSyncing,
  onSyncPress,
}) => {
  if (pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.textContainer}>
        <Text style={styles.bannerIcon}>⚠️</Text>
        <Text style={styles.bannerText}>
          {isSyncing
            ? 'Syncing offline records with server...'
            : `${pendingCount} offline dose action${pendingCount > 1 ? 's' : ''} pending sync`}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.syncButton}
        onPress={onSyncPress}
        disabled={isSyncing}
        accessibilityRole="button"
        accessibilityLabel="Sync offline actions now"
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.syncBtnText}>SYNC NOW</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#451a03',
    borderWidth: 1,
    borderColor: THEME.colors.warning,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  bannerIcon: {
    fontSize: 18,
  },
  bannerText: {
    flex: 1,
    color: '#fef08a',
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.medium,
  },
  syncButton: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: THEME.typography.weights.bold,
    fontSize: THEME.typography.sizes.xs,
  },
});
