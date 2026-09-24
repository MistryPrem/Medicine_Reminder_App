import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DoseCard } from '../components/DoseCard';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { OfflineSyncBanner } from '../components/OfflineSyncBanner';
import { MedicationDose } from '../types/dose';
import { syncService, fetchAndCacheTodayDoses } from '../services/syncService';
import { getOfflineActionQueue } from '../storage/offlineDb';
import { THEME } from '../constants/theme';

export const ElderlyHomeScreen: React.FC = () => {
  const { user, elderlyProfile, logout } = useAuth();
  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const checkPendingQueue = useCallback(async () => {
    const queue = await getOfflineActionQueue();
    setPendingSyncCount(queue.length);
  }, []);

  const loadDoses = useCallback(async () => {
    try {
      const fetched = await fetchAndCacheTodayDoses(elderlyProfile?._id);
      setDoses(fetched);
    } catch (err) {
      console.warn('Failed to load doses:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      await checkPendingQueue();
    }
  }, [elderlyProfile, checkPendingQueue]);

  useEffect(() => {
    loadDoses();
  }, [loadDoses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDoses();
  };

  const handleAction = async (doseId: string, action: 'TAKEN' | 'SNOOZE' | 'SKIP') => {
    const nowIso = new Date().toISOString();
    setDoses(prev =>
      prev.map(d => {
        if (d._id === doseId) {
          return {
            ...d,
            status: action === 'TAKEN' ? 'taken' : action === 'SKIP' ? 'skipped' : 'snoozed',
            takenAt: action === 'TAKEN' ? nowIso : d.takenAt,
          };
        }
        return d;
      })
    );

    try {
      if (action === 'TAKEN') {
        await syncService.recordDoseTaken(doseId);
      } else if (action === 'SNOOZE') {
        await syncService.snoozeDose(doseId, 15);
      } else if (action === 'SKIP') {
        await syncService.skipDose(doseId, 'Skipped by senior');
      }
    } catch {
      Alert.alert('Action Queued', 'Your action was saved offline and will sync automatically.');
    } finally {
      await checkPendingQueue();
      loadDoses();
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const syncedCount = await syncService.syncPendingQueue();
      Alert.alert('Sync Complete', `Successfully synced ${syncedCount} offline record(s).`);
      await loadDoses();
    } catch {
      Alert.alert('Sync Failed', 'Could not connect to server. Will retry automatically.');
    } finally {
      setIsSyncing(false);
      await checkPendingQueue();
    }
  };

  const caregiverName = elderlyProfile?.primaryCaregiverId?.name;
  const caregiverPhone = elderlyProfile?.primaryCaregiverId?.phoneNumber;

  const todayDateString = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Friend'}</Text>
          <Text style={styles.dateSubtext}>{todayDateString}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} accessibilityRole="button">
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={doses}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <EmergencyBanner
              caregiverName={caregiverName}
              caregiverPhone={caregiverPhone}
            />

            <OfflineSyncBanner
              pendingCount={pendingSyncCount}
              isSyncing={isSyncing}
              onSyncPress={handleManualSync}
            />

            <Text style={styles.sectionTitle}>Today's Medication Doses</Text>
          </>
        }
        renderItem={({ item }) => (
          <DoseCard dose={item} onAction={handleAction} disabled={isSyncing} />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtitle}>No upcoming doses scheduled for today.</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  greeting: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
  },
  dateSubtext: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.surfaceElevated,
  },
  logoutText: {
    color: THEME.colors.textSecondary,
    fontWeight: THEME.typography.weights.semibold,
    fontSize: THEME.typography.sizes.xs,
  },
  listContent: {
    padding: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: THEME.typography.sizes.md,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});
