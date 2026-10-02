import { Vibration } from 'react-native';
import { MedicationDose } from '../types/dose';
import { getUserPreferences } from '../storage/preferencesStorage';

export interface ActiveAlarmPayload {
  doseId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  ringtone: string;
}

type AlarmCallback = (payload: ActiveAlarmPayload) => void;

class AlarmMonitorService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: AlarmCallback[] = [];
  private triggeredDoseIds = new Set<string>();

  startMonitoring(getDoses: () => MedicationDose[]) {
    if (this.intervalId) return;

    // Check doses against current time every 15 seconds
    this.intervalId = setInterval(async () => {
      const prefs = await getUserPreferences();
      if (!prefs.notificationsEnabled && !prefs.alarmSoundEnabled) {
        return;
      }

      const doses = getDoses();
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      for (const dose of doses) {
        // Only trigger for pending scheduled or reminder_sent doses
        if (dose.status !== 'scheduled' && dose.status !== 'reminder_sent') {
          continue;
        }

        if (this.triggeredDoseIds.has(dose._id)) {
          continue;
        }

        const scheduledDate = new Date(dose.scheduledFor);
        const doseHours = scheduledDate.getHours();
        const doseMinutes = scheduledDate.getMinutes();

        // Check if scheduled time matches current hour & minute
        if (doseHours === currentHours && doseMinutes === currentMinutes) {
          this.triggeredDoseIds.add(dose._id);

          // Vibrate device if vibration is enabled
          if (prefs.vibrate) {
            Vibration.vibrate([0, 600, 300, 600, 300, 1000]);
          }

          const payload: ActiveAlarmPayload = {
            doseId: dose._id,
            medicationName: dose.medicationId?.name || 'Medicine',
            dosage: `${dose.medicationId?.dosage || ''} ${dose.medicationId?.dosageUnit || ''}`.trim(),
            scheduledTime: scheduledDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            ringtone: prefs.ringtone,
          };

          this.listeners.forEach((callback) => callback(payload));
        }
      }
    }, 15000);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onAlarm(callback: AlarmCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  dismissAlarm(doseId: string) {
    Vibration.cancel();
  }
}

export const alarmMonitor = new AlarmMonitorService();
