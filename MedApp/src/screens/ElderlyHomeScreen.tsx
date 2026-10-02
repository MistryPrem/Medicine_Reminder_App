import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MedicationDose } from '../types/dose';
import * as doseService from '../services/doseService';
import {
  saveTodayDosesLocally,
  getLocalTodayDoses,
  getOfflineQueue,
} from '../storage/offlineStorage';
import { DoseCard } from '../components/DoseCard';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { OfflineSyncBanner } from '../components/OfflineSyncBanner';
import { CustomLoader, CustomButton, CustomCard } from '../components/common';
import { THEME } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

export const ElderlyHomeScreen: React.FC = () => {
  const { user, elderlyProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Check offline queue count
      const queue = await getOfflineQueue();
      setOfflineQueueCount(queue.length);

      // Attempt remote fetch
      const remoteDoses = await doseService.getTodayDoses();
      setDoses(remoteDoses);
      await saveTodayDosesLocally(remoteDoses);
    } catch (error) {
      console.warn('Network fetch failed, loading local doses:', error);
      const localDoses = await getLocalTodayDoses();
      if (localDoses.length > 0) {
        setDoses(localDoses);
        showToast({ message: 'Viewing saved offline schedule.', type: 'warning' });
      } else {
        showToast({ message: 'Could not load today doses. Check internet connection.', type: 'error' });
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTake = async (doseId: string) => {
    try {
      await doseService.markDoseTaken(doseId);
      showToast({ message: 'Dose recorded as taken! Great job.', type: 'success' });
      loadData();
    } catch {
      showToast({ message: 'Saved offline. Will sync once connected.', type: 'info' });
      loadData();
    }
  };

  const handleSnooze = async (doseId: string, minutes: number) => {
    try {
      await doseService.snoozeDose(doseId, minutes);
      showToast({ message: `Snoozed for ${minutes} minutes.`, type: 'info' });
      loadData();
    } catch {
      showToast({ message: 'Snooze saved offline.', type: 'info' });
      loadData();
    }
  };

  const handleSkip = async (doseId: string, reason?: string) => {
    try {
      await doseService.skipDose(doseId, reason);
      showToast({ message: 'Dose marked as skipped.', type: 'warning' });
      loadData();
    } catch {
      showToast({ message: 'Skip saved offline.', type: 'info' });
      loadData();
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const syncedCount = await doseService.flushOfflineQueue();
      showToast({ message: `Synchronized ${syncedCount} offline actions!`, type: 'success' });
      await loadData();
    } catch {
      showToast({ message: 'Sync failed. Will retry automatically.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = doses.filter((d) => d.status === 'scheduled' || d.status === 'reminder_sent' || d.status === 'snoozed').length;

  if (isLoading) {
    return <CustomLoader message="Loading medication schedule..." fullscreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />}
    >
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'User'}</Text>
          <Text style={styles.userRoleTag}>
            {user?.role === 'individual' ? 'Personal Reminders' : user?.role === 'elderly' ? 'Senior Portal' : 'Caregiver'}
          </Text>
        </View>

        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('History')}
            accessibilityLabel="View Dose History"
          >
            <Text style={styles.historyBtnText}>📊 History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            accessibilityLabel="Sign Out"
          >
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Contact Banner */}
      {elderlyProfile?.emergencyContactPhone ? (
        <EmergencyBanner
          contactName={elderlyProfile.emergencyContactName}
          phoneNumber={elderlyProfile.emergencyContactPhone}
        />
      ) : null}

      {/* Offline Queue Sync Bar */}
      <OfflineSyncBanner
        queueCount={offlineQueueCount}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
      />

      {/* Today's Summary Card */}
      <CustomCard variant="primary" style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View>
            <Text style={styles.summaryTitle}>Today's Schedule</Text>
            <Text style={styles.summarySubtitle}>
              {pendingCount === 0 ? 'All doses completed for today! 🎉' : `${pendingCount} remaining doses scheduled.`}
            </Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{pendingCount}</Text>
          </View>
        </View>
      </CustomCard>

      {/* Medication Doses Stack */}
      {doses.length === 0 ? (
        <CustomCard style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>No Medications Today</Text>
          <Text style={styles.emptyText}>
            You have no doses scheduled for today. Relax and stay well hydrated!
          </Text>
        </CustomCard>
      ) : (
        doses.map((dose) => (
          <DoseCard
            key={dose._id}
            dose={dose}
            onTake={handleTake}
            onSnooze={handleSnooze}
            onSkip={handleSkip}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  greeting: {
    ...THEME.typography.headerLarge,
    fontSize: 24,
  },
  userRoleTag: {
    ...THEME.typography.caption,
    color: THEME.colors.primary,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBtn: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  logoutBtn: {
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: 8,
    borderRadius: THEME.radii.md,
  },
  logoutText: {
    fontSize: 16,
  },
  summaryCard: {
    padding: 16,
    marginBottom: THEME.spacing.lg,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  summarySubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  badgeCount: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
});
