import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MedicationDose } from '../types/dose';
import { THEME } from '../constants/theme';
import { CustomButton } from './common/CustomButton';
import { CustomModal } from './common/CustomModal';
import { CustomTextInput } from './common/CustomTextInput';

interface DoseCardProps {
  dose: MedicationDose;
  onTake: (doseId: string) => Promise<void>;
  onSnooze: (doseId: string, minutes: number) => Promise<void>;
  onSkip: (doseId: string, reason?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const DoseCard: React.FC<DoseCardProps> = ({
  dose,
  onTake,
  onSnooze,
  onSkip,
  isProcessing = false,
}) => {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [localProcessing, setLocalProcessing] = useState(false);

  // 12-hour AM/PM Time formatted
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const handleAction = async (action: () => Promise<void>) => {
    setLocalProcessing(true);
    try {
      await action();
    } finally {
      setLocalProcessing(false);
    }
  };

  const isCompleted = dose.status === 'taken';
  const isSkipped = dose.status === 'skipped';
  const isMissed = dose.status === 'missed';
  const isSnoozed = dose.status === 'snoozed';

  const busy = isProcessing || localProcessing;
  const activeAlarm = dose.scheduleId || dose.medicationId?.schedule;

  return (
    <View
      style={[
        styles.card,
        isCompleted && styles.cardTaken,
        isMissed && styles.cardMissed,
        isSkipped && styles.cardSkipped,
      ]}
    >
      {/* Header with Scheduled Time and Status */}
      <View style={styles.header}>
        <View style={styles.timeBadge}>
          <Text style={styles.clockIcon}>🕒</Text>
          <Text style={styles.timeText}>{formatTime(dose.scheduledFor)}</Text>
          <Text style={styles.zoneTag}>IST</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            isCompleted && styles.statusPillTaken,
            isMissed && styles.statusPillMissed,
            isSnoozed && styles.statusPillSnoozed,
            isSkipped && styles.statusPillSkipped,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isCompleted && styles.statusTextTaken,
              isMissed && styles.statusTextMissed,
              isSnoozed && styles.statusTextSnoozed,
              isSkipped && styles.statusTextSkipped,
            ]}
          >
            {dose.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Medication Details */}
      <View style={styles.content}>
        <Text style={styles.medName}>{dose.medicationId?.name}</Text>
        <Text style={styles.dosageText}>
          {dose.medicationId?.dosage} {dose.medicationId?.dosageUnit}
          {dose.medicationId?.pillsPerDose > 1 ? ` (${dose.medicationId.pillsPerDose} pills)` : ''}
        </Text>

        {dose.medicationId?.instructions ? (
          <Text style={styles.instructionsText}>
            "{dose.medicationId.instructions}"
          </Text>
        ) : null}

        {/* Alarm configuration preview */}
        {activeAlarm?.alarmSound ? (
          <View style={styles.alarmBadge}>
            <Text style={styles.alarmIcon}>🔔</Text>
            <Text style={styles.alarmText}>
              Alarm: {activeAlarm.alarmSound} {activeAlarm.vibrate ? '• Vibrate' : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons for Pending or Snoozed Doses */}
      {!isCompleted && !isSkipped && (
        <View style={styles.actionsContainer}>
          <CustomButton
            title="TAKE"
            variant="success"
            size="md"
            onPress={() => handleAction(() => onTake(dose._id))}
            isLoading={busy}
            style={styles.actionBtnTake}
          />

          <CustomButton
            title="SNOOZE 15m"
            variant="outline"
            size="md"
            onPress={() => handleAction(() => onSnooze(dose._id, 15))}
            disabled={busy}
            style={styles.actionBtnSnooze}
          />

          <CustomButton
            title="SKIP"
            variant="ghost"
            size="md"
            onPress={() => setShowSkipModal(true)}
            disabled={busy}
            style={styles.actionBtnSkip}
          />
        </View>
      )}

      {/* Skip Confirmation Modal */}
      <CustomModal
        visible={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        title={`Skip ${dose.medicationId?.name}`}
        footer={
          <>
            <CustomButton
              title="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setShowSkipModal(false)}
            />
            <CustomButton
              title="Confirm Skip"
              variant="danger"
              size="sm"
              onPress={async () => {
                await handleAction(() => onSkip(dose._id, skipReason));
                setShowSkipModal(false);
              }}
            />
          </>
        }
      >
        <Text style={styles.skipPrompt}>
          Please share a reason for your records or caregiver (optional):
        </Text>
        <CustomTextInput
          placeholder="e.g. Felt dizzy, doctor advised to hold..."
          value={skipReason}
          onChangeText={setSkipReason}
          multiline
          numberOfLines={3}
        />
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    borderLeftWidth: 6,
    borderLeftColor: THEME.colors.primary,
    ...THEME.shadows.card,
  },
  cardTaken: {
    borderLeftColor: THEME.colors.success,
    backgroundColor: '#f6fdf9',
  },
  cardMissed: {
    borderLeftColor: THEME.colors.danger,
    backgroundColor: '#fff8f8',
  },
  cardSkipped: {
    borderLeftColor: THEME.colors.textMuted,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIcon: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  zoneTag: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  statusPillTaken: {
    backgroundColor: THEME.colors.successLight,
  },
  statusPillMissed: {
    backgroundColor: THEME.colors.dangerLight,
  },
  statusPillSnoozed: {
    backgroundColor: '#ede9fe',
  },
  statusPillSkipped: {
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  statusTextTaken: {
    color: THEME.colors.success,
  },
  statusTextMissed: {
    color: THEME.colors.danger,
  },
  statusTextSnoozed: {
    color: '#7c3aed',
  },
  statusTextSkipped: {
    color: THEME.colors.textMuted,
  },
  content: {
    marginBottom: 16,
  },
  medName: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  instructionsText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
  alarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.sm,
    alignSelf: 'flex-start',
  },
  alarmIcon: {
    fontSize: 12,
  },
  alarmText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnTake: {
    flex: 2,
  },
  actionBtnSnooze: {
    flex: 1.5,
  },
  actionBtnSkip: {
    flex: 1,
  },
  skipPrompt: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 12,
  },
});
