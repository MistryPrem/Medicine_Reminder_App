import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MedicationDose } from '../types/dose';
import * as doseService from '../services/doseService';
import { CustomDatePicker } from '../components/common/CustomDatePicker';
import { CustomLoader, CustomCard } from '../components/common';
import { THEME } from '../constants/theme';
import { useToast } from '../context/ToastContext';

export const HistoryScreen: React.FC = () => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [historyDoses, setHistoryDoses] = useState<MedicationDose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (date: Date) => {
    try {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const data = await doseService.getDoseHistory(start.toISOString(), end.toISOString());
      setHistoryDoses(data);
    } catch (err: any) {
      showToast({ message: 'Failed to load dose history', type: 'error' });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHistory(selectedDate);
  }, [selectedDate, fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory(selectedDate);
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return { bg: THEME.colors.successLight, text: THEME.colors.success, label: 'TAKEN' };
      case 'missed':
        return { bg: THEME.colors.dangerLight, text: THEME.colors.danger, label: 'MISSED' };
      case 'skipped':
        return { bg: '#f1f5f9', text: THEME.colors.textMuted, label: 'SKIPPED' };
      default:
        return { bg: THEME.colors.primaryLight, text: THEME.colors.primary, label: 'SCHEDULED' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Medication Adherence History</Text>
      <Text style={styles.subtitle}>Filter and inspect your previous dose records</Text>

      {/* Date Filter Component */}
      <CustomDatePicker
        label="Filter by Date"
        value={selectedDate}
        onChange={(d) => {
          setSelectedDate(d);
          setIsLoading(true);
        }}
      />

      {isLoading ? (
        <CustomLoader message="Loading history records..." />
      ) : historyDoses.length === 0 ? (
        <CustomCard style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Records Found</Text>
          <Text style={styles.emptySubtitle}>
            There are no dose history events recorded for {selectedDate.toLocaleDateString()}.
          </Text>
        </CustomCard>
      ) : (
        historyDoses.map((item) => {
          const badge = getStatusBadge(item.status);
          return (
            <CustomCard key={item._id} style={styles.doseCard}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.medName}>{item.medicationId?.name}</Text>
                  <Text style={styles.dosageText}>
                    {item.medicationId?.dosage} {item.medicationId?.dosageUnit}
                  </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.timeText}>
                  Scheduled: {formatTime(item.scheduledFor)}
                </Text>
                {item.takenAt && (
                  <Text style={styles.takenText}>
                    Taken: {formatTime(item.takenAt)}
                  </Text>
                )}
                {item.skippedReason && (
                  <Text style={styles.skippedText}>
                    Reason: "{item.skippedReason}"
                  </Text>
                )}
              </View>
            </CustomCard>
          );
        })
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
  title: {
    ...THEME.typography.headerLarge,
    fontSize: 22,
    marginBottom: 4,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  doseCard: {
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  medName: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  dosageText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  takenText: {
    fontSize: 12,
    color: THEME.colors.success,
    fontWeight: '600',
  },
  skippedText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
});
