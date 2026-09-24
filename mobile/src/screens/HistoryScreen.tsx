import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { THEME } from '../constants/theme';

interface LogItem {
  _id: string;
  doseId: string;
  medicationName: string;
  action: 'TAKEN' | 'MISSED' | 'SKIPPED' | 'SNOOZED';
  actionTimestamp: string;
  actionSource: 'ELDERLY' | 'CAREGIVER' | 'SYSTEM';
  notes?: string;
}

export const HistoryScreen: React.FC = () => {
  const { elderlyProfile } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchHistory();
  }, [elderlyProfile]);

  const fetchHistory = async () => {
    try {
      if (!elderlyProfile?._id) return;
      const res = await api.get(`/doses/history?elderlyId=${elderlyProfile._id}`);
      setLogs(res.data.data);
    } catch (err) {
      console.warn('Failed to load dose history:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: LogItem }) => {
    const timeFormatted = new Date(item.actionTimestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isTaken = item.action === 'TAKEN';
    const isMissed = item.action === 'MISSED';
    const isSkipped = item.action === 'SKIPPED';

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <Text style={styles.medName}>{item.medicationName || 'Medication'}</Text>
          <View
            style={[
              styles.actionBadge,
              isTaken ? styles.badgeTaken :
              isMissed ? styles.badgeMissed :
              isSkipped ? styles.badgeSkipped : styles.badgeSnoozed,
            ]}
          >
            <Text style={styles.badgeText}>{item.action}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{timeFormatted}</Text>
        {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Dose History</Text>
      {loading ? (
        <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No history logs found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingTop: THEME.spacing.xl,
  },
  screenTitle: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  logCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medName: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeTaken: {
    backgroundColor: '#064e3b',
  },
  badgeMissed: {
    backgroundColor: '#7f1d1d',
  },
  badgeSkipped: {
    backgroundColor: '#334155',
  },
  badgeSnoozed: {
    backgroundColor: '#78350f',
  },
  badgeText: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.bold,
    color: '#ffffff',
  },
  timestamp: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textMuted,
  },
  notesText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: THEME.typography.sizes.md,
    color: THEME.colors.textMuted,
  },
});
