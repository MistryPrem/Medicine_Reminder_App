import { Vibration, Platform } from 'react-native';
import notifee, { AndroidImportance, AndroidCategory, AndroidVisibility } from '@notifee/react-native';
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
  private channelCreated = false;

  private async ensureNotificationChannel() {
    if (this.channelCreated || Platform.OS !== 'android') return;
    try {
      await notifee.createChannel({
        id: 'medication_alarms',
        name: 'Medication Alarms & Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default', // Plays native Android system alarm/ringtone
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
      });
      this.channelCreated = true;
    } catch (e) {
      console.warn('Could not create notifee notification channel:', e);
    }
  }

  startMonitoring(getDoses: () => MedicationDose[]) {
    if (this.intervalId) return;

    this.ensureNotificationChannel();

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

          // 1. Vibrate device if enabled
          if (prefs.vibrate) {
            try {
              Vibration.vibrate([0, 600, 300, 600, 300, 1000]);
            } catch (vibErr) {
              console.warn('Vibration failed:', vibErr);
            }
          }

          const medName = dose.medicationId?.name || 'Medicine';
          const dosageStr = `${dose.medicationId?.dosage || ''} ${dose.medicationId?.dosageUnit || ''}`.trim();
          const scheduledTimeStr = scheduledDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          // 2. Trigger System Notification & Ringtone sound via Notifee
          if (prefs.notificationsEnabled || prefs.alarmSoundEnabled) {
            try {
              await this.ensureNotificationChannel();
              await notifee.displayNotification({
                id: dose._id,
                title: `⏰ Time for ${medName}!`,
                body: `Scheduled dose (${dosageStr}) is due now at ${scheduledTimeStr}.`,
                android: {
                  channelId: 'medication_alarms',
                  importance: AndroidImportance.HIGH,
                  sound: prefs.alarmSoundEnabled ? 'default' : undefined,
                  category: AndroidCategory.ALARM,
                  visibility: AndroidVisibility.PUBLIC,
                  pressAction: {
                    id: 'default',
                  },
                },
              });
            } catch (notifErr) {
              console.warn('Notifee displayNotification error:', notifErr);
            }
          }

          const payload: ActiveAlarmPayload = {
            doseId: dose._id,
            medicationName: medName,
            dosage: dosageStr,
            scheduledTime: scheduledTimeStr,
            ringtone: prefs.ringtone,
          };

          // 3. Broadcast to in-app pop-up modal
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

  async dismissAlarm(doseId: string) {
    Vibration.cancel();
    try {
      await notifee.cancelNotification(doseId);
    } catch {
      // ignore
    }
  }
}

export const alarmMonitor = new AlarmMonitorService();
