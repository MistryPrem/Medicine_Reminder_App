import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MedicationDose } from '../types/dose';
import { THEME } from '../constants/theme';

interface DoseCardProps {
  dose: MedicationDose;
  onAction: (doseId: string, action: 'TAKEN' | 'SNOOZE' | 'SKIP') => void;
  disabled?: boolean;
}

export const DoseCard: React.FC<DoseCardProps> = ({ dose, onAction, disabled = false }) => {
  const isTaken = dose.status === 'taken';
  const isSkipped = dose.status === 'skipped';
  const isMissed = dose.status === 'missed';
  const isScheduled = dose.status === 'scheduled' || dose.status === 'reminder_sent';

  const scheduledTime = dose.scheduledAt || dose.scheduledFor;
  const timeString = scheduledTime
    ? new Date(scheduledTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  return (
    <View
      style={[
        styles.card,
        isTaken && styles.cardTaken,
        isMissed && styles.cardMissed,
        isSkipped && styles.cardSkipped,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{timeString}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            isTaken
              ? styles.statusTaken
              : isMissed
              ? styles.statusMissed
              : isSkipped
              ? styles.statusSkipped
              : styles.statusScheduled,
          ]}
        >
          <Text style={styles.statusText}>{dose.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.medName}>{dose.medicationName || dose.medicationId?.name || 'Medication'}</Text>
        <Text style={styles.dosageText}>
          {dose.dosageQuantity || dose.medicationId?.dosage || ''}{' '}
          {dose.dosageUnit || dose.medicationId?.dosageUnit || ''}
          {dose.instructions || dose.medicationId?.instructions ? ` • ${dose.instructions || dose.medicationId?.instructions}` : ''}
        </Text>
      </View>

      {isScheduled && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.takenBtn, disabled && styles.btnDisabled]}
            onPress={() => onAction(dose._id, 'TAKEN')}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${dose.medicationName} as taken`}
          >
            <Text style={styles.takenBtnText}>✓ TAKEN</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.snoozeBtn, disabled && styles.btnDisabled]}
              onPress={() => onAction(dose._id, 'SNOOZE')}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Snooze ${dose.medicationName} for 15 minutes`}
            >
              <Text style={styles.snoozeBtnText}>⏱ SNOOZE 15M</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.skipBtn, disabled && styles.btnDisabled]}
              onPress={() => onAction(dose._id, 'SKIP')}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Skip dose for ${dose.medicationName}`}
            >
              <Text style={styles.skipBtnText}>✕ SKIP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTaken: {
    borderColor: THEME.colors.success,
    backgroundColor: '#064e3b',
  },
  cardMissed: {
    borderColor: THEME.colors.danger,
    backgroundColor: '#7f1d1d',
  },
  cardSkipped: {
    borderColor: THEME.colors.textMuted,
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  timeBadge: {
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.bold,
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusScheduled: {
    backgroundColor: '#0369a1',
  },
  statusTaken: {
    backgroundColor: '#059669',
  },
  statusMissed: {
    backgroundColor: '#b91c1c',
  },
  statusSkipped: {
    backgroundColor: '#475569',
  },
  statusText: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.bold,
    color: '#ffffff',
  },
  body: {
    marginVertical: THEME.spacing.sm,
  },
  medName: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
  },
  dosageText: {
    fontSize: THEME.typography.sizes.md,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: THEME.spacing.md,
  },
  actionBtn: {
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  takenBtn: {
    backgroundColor: THEME.colors.success,
    paddingVertical: 14,
    marginBottom: THEME.spacing.sm,
  },
  takenBtnText: {
    color: THEME.colors.textLight,
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.bold,
    letterSpacing: 1,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  snoozeBtn: {
    flex: 1,
    backgroundColor: THEME.colors.warning,
    paddingVertical: 10,
  },
  snoozeBtnText: {
    color: THEME.colors.textDark,
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.bold,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: '#475569',
    paddingVertical: 10,
  },
  skipBtnText: {
    color: THEME.colors.textLight,
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.bold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
