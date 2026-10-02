import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
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
import { CustomLoader, CustomButton, CustomCard, CustomModal } from '../components/common';
import { THEME } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types/navigation';
import { alarmMonitor, ActiveAlarmPayload } from '../services/alarmMonitor';

export const ElderlyHomeScreen: React.FC = () => {
  const { user, elderlyProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const isFirstLoadRef = useRef(true);
  const hasNotifiedOfflineRef = useRef(false);

  const loadData = useCallback(async (isManualRefresh = false) => {
    try {
      // Check offline queue count
      const queue = await getOfflineQueue();
      setOfflineQueueCount(queue.length);

      // Attempt remote fetch
      const remoteDoses = await doseService.getTodayDoses();
      setDoses(remoteDoses);
      await saveTodayDosesLocally(remoteDoses);
      hasNotifiedOfflineRef.current = false;
    } catch (error: any) {
      console.warn('Network fetch failed, loading local doses:', error?.message || error);
      const localDoses = await getLocalTodayDoses();
      if (localDoses.length > 0) {
        setDoses(localDoses);
        if (!hasNotifiedOfflineRef.current && isManualRefresh) {
          showToast({ message: 'Viewing saved offline schedule.', type: 'warning' });
          hasNotifiedOfflineRef.current = true;
        }
      } else if (isManualRefresh) {
        showToast({ message: 'Could not load today doses. Check internet connection.', type: 'error' });
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmPayload | null>(null);
  const dosesRef = useRef<MedicationDose[]>([]);

  useEffect(() => {
    dosesRef.current = doses;
  }, [doses]);

  useEffect(() => {
    loadData();

    // Start background in-app alarm monitor reading from dosesRef
    alarmMonitor.startMonitoring(() => dosesRef.current);

    const unsubscribe = alarmMonitor.onAlarm((alarm) => {
      setActiveAlarm(alarm);
    });

    return () => {
      unsubscribe();
      alarmMonitor.stopMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
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

  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTopPadding = Math.max(insets.top, statusBarHeight, 28) + 16;

  const pendingDoses = doses.filter((d) => d.status === 'scheduled' || d.status === 'reminder_sent' || d.status === 'snoozed');
  const completedDoses = doses.filter((d) => d.status === 'taken' || d.status === 'skipped');
  const pendingCount = pendingDoses.length;

  const visibleDoses = activeTab === 'pending'
    ? pendingDoses
    : activeTab === 'completed'
    ? completedDoses
    : doses;

  if (isLoading) {
    return <CustomLoader message="Loading medication schedule..." fullscreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: safeTopPadding }]}
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
            style={styles.addMedBtn}
            onPress={() => navigation.navigate('AddMedication')}
            accessibilityLabel="Add Medication"
          >
            <Text style={styles.addMedBtnText}>+ Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('History')}
            accessibilityLabel="View Dose History"
          >
            <Text style={styles.historyBtnText}>📊</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('ProfileSettings')}
            accessibilityLabel="Profile & Settings"
          >
            <Text style={styles.settingsBtnText}>⚙️</Text>
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
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>Today's Overview</Text>
            <Text style={styles.summarySubtitle}>
              {pendingCount === 0 ? 'All doses completed for today! 🎉' : `${pendingCount} medicine${pendingCount > 1 ? 's' : ''} awaiting action`}
            </Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{pendingCount}</Text>
          </View>
        </View>
      </CustomCard>

      {/* Filter Tabs (Pending / Completed / All) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingDoses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed ({completedDoses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({doses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Medication Doses Stack */}
      {visibleDoses.length === 0 ? (
        <CustomCard style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'pending' ? '🎉' : activeTab === 'completed' ? '📝' : '💊'}
          </Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'pending'
              ? 'No Pending Medicines'
              : activeTab === 'completed'
              ? 'No Completed Medicines'
              : 'No Medications Today'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending'
              ? doses.length > 0
                ? 'All scheduled medicines for today have been taken or skipped!'
                : 'You have no medicines scheduled for today.'
              : activeTab === 'completed'
              ? 'Medicines marked as taken or skipped will appear here.'
              : 'Add a new medication using the + Add button above.'}
          </Text>
        </CustomCard>
      ) : (
        visibleDoses.map((dose) => (
          <DoseCard
            key={dose._id}
            dose={dose}
            onTake={handleTake}
            onSnooze={handleSnooze}
            onSkip={handleSkip}
          />
        ))
      )}

      {/* Active High-Priority Alarm Alert Modal */}
      {activeAlarm && (
        <CustomModal
          visible={true}
          onClose={() => {
            alarmMonitor.dismissAlarm(activeAlarm.doseId);
            setActiveAlarm(null);
          }}
          title="🔔 MEDICATION REMINDER"
          footer={
            <>
              <CustomButton
                title="⏰ SNOOZE 15m"
                variant="outline"
                size="md"
                onPress={async () => {
                  alarmMonitor.dismissAlarm(activeAlarm.doseId);
                  const id = activeAlarm.doseId;
                  setActiveAlarm(null);
                  await handleSnooze(id, 15);
                }}
              />
              <CustomButton
                title="✓ TAKE NOW"
                variant="success"
                size="md"
                onPress={async () => {
                  alarmMonitor.dismissAlarm(activeAlarm.doseId);
                  const id = activeAlarm.doseId;
                  setActiveAlarm(null);
                  await handleTake(id);
                }}
              />
            </>
          }
        >
          <View style={styles.alarmModalContent}>
            <Text style={styles.alarmModalIcon}>💊</Text>
            <Text style={styles.alarmModalTitle}>{activeAlarm.medicationName}</Text>
            <Text style={styles.alarmModalDosage}>{activeAlarm.dosage}</Text>
            <Text style={styles.alarmModalTime}>Scheduled for: {activeAlarm.scheduledTime}</Text>
            <Text style={styles.alarmModalSubtext}>
              Please take your prescribed dose on time for best health outcomes.
            </Text>
          </View>
        </CustomModal>
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
    paddingVertical: 4,
  },
  greeting: {
    ...THEME.typography.headerLarge,
    fontSize: 22,
    color: THEME.colors.text,
  },
  userRoleTag: {
    ...THEME.typography.caption,
    color: THEME.colors.primary,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addMedBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: THEME.radii.md,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addMedBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  historyBtn: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBtnText: {
    fontSize: 16,
  },
  settingsBtn: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    padding: 4,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radii.sm,
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: THEME.colors.primary,
  },
  summaryCard: {
    padding: 16,
    marginBottom: THEME.spacing.md,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTextContainer: {
    flex: 1,
    marginRight: 12,
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
  alarmModalContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  alarmModalIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  alarmModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  alarmModalDosage: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 4,
  },
  alarmModalTime: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginTop: 6,
  },
  alarmModalSubtext: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 8,
  },
});
