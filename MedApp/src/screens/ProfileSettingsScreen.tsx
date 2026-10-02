import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import notifee, { AndroidImportance, AndroidCategory, AndroidVisibility } from '@notifee/react-native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { THEME } from '../constants/theme';
import {
  CustomButton,
  CustomDropdown,
  CustomCard,
  CustomModal,
} from '../components/common';
import {
  getUserPreferences,
  saveUserPreferences,
  AlarmRingtone,
} from '../storage/preferencesStorage';

const RINGTONE_OPTIONS = [
  { label: '🔔 Gentle Bell', value: 'gentle_bell' },
  { label: '✨ Classic Chime', value: 'chime' },
  { label: '🚨 Digital Alarm', value: 'digital_alarm' },
  { label: '🎵 Soothing Melody', value: 'melody' },
  { label: '📡 Radar Beep', value: 'radar' },
];

const SNOOZE_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes (Standard)', value: 15 },
  { label: '30 minutes', value: 30 },
];

export const ProfileSettingsScreen: React.FC = () => {
  const { user, elderlyProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alarmSoundEnabled, setAlarmSoundEnabled] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [ringtone, setRingtone] = useState<AlarmRingtone>('gentle_bell');
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(15);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const prefs = await getUserPreferences();
      setNotificationsEnabled(prefs.notificationsEnabled);
      setAlarmSoundEnabled(prefs.alarmSoundEnabled);
      setVibrate(prefs.vibrate);
      setRingtone(prefs.ringtone);
      setSnoozeMinutes(prefs.snoozeDurationMinutes);
    };
    load();
  }, []);

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await saveUserPreferences({ notificationsEnabled: val });
    showToast({
      message: val ? 'Notifications enabled' : 'Notifications disabled',
      type: val ? 'success' : 'warning',
    });
  };

  const handleToggleAlarmSound = async (val: boolean) => {
    setAlarmSoundEnabled(val);
    await saveUserPreferences({ alarmSoundEnabled: val });
    showToast({
      message: val ? 'Alarm sound turned ON' : 'Alarm sound muted',
      type: val ? 'success' : 'warning',
    });
  };

  const handleToggleVibrate = async (val: boolean) => {
    setVibrate(val);
    await saveUserPreferences({ vibrate: val });
    if (val) Vibration.vibrate(300);
    showToast({
      message: val ? 'Vibration enabled' : 'Vibration disabled',
      type: 'info',
    });
  };

  const handleSelectRingtone = async (val: string | number) => {
    const tone = val as AlarmRingtone;
    setRingtone(tone);
    await saveUserPreferences({ ringtone: tone });
    Vibration.vibrate(200);
    showToast({ message: `Ringtone changed to ${tone.replace('_', ' ')}`, type: 'success' });
  };

  const handleSelectSnooze = async (val: string | number) => {
    const mins = Number(val);
    setSnoozeMinutes(mins);
    await saveUserPreferences({ snoozeDurationMinutes: mins });
    showToast({ message: `Default snooze set to ${mins} minutes`, type: 'success' });
  };

  const handleTestAlarm = async () => {
    if (vibrate) {
      try {
        Vibration.vibrate([0, 400, 200, 400]);
      } catch (e) {
        console.warn('Vibration test error:', e);
      }
    }

    try {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'test_alarm_channel',
          name: 'Test Alarm Channel',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: vibrate,
        });
      }

      await notifee.displayNotification({
        title: '🔔 Test Medication Alarm',
        body: `Testing alarm sound [${ringtone.replace('_', ' ')}] with ${vibrate ? 'vibration' : 'no vibration'}.`,
        android: {
          channelId: 'test_alarm_channel',
          importance: AndroidImportance.HIGH,
          sound: alarmSoundEnabled ? 'default' : undefined,
          category: AndroidCategory.ALARM,
          visibility: AndroidVisibility.PUBLIC,
          pressAction: { id: 'default' },
        },
      });
    } catch (err) {
      console.warn('Notifee test alarm sound error:', err);
    }

    showToast({
      message: `🔔 Test Alarm: Triggered [${ringtone.replace('_', ' ')}] with ${vibrate ? 'vibration' : 'no vibration'}!`,
      type: 'info',
      duration: 3500,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Profile & Settings</Text>
      <Text style={styles.subtitle}>Customize alarms, notifications, and profile details</Text>

      {/* User Information Card */}
      <CustomCard style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || user?.phoneNumber}</Text>
            <Text style={styles.userRole}>
              Role: {user?.role === 'individual' ? 'Personal Reminders' : user?.role === 'elderly' ? 'Senior Portal' : 'Caregiver'}
            </Text>
          </View>
        </View>

        {elderlyProfile?.emergencyContactPhone ? (
          <View style={styles.emergencyBox}>
            <Text style={styles.emergencyLabel}>🚨 Emergency Contact:</Text>
            <Text style={styles.emergencyValue}>
              {elderlyProfile.emergencyContactName} ({elderlyProfile.emergencyContactPhone})
            </Text>
          </View>
        ) : null}
      </CustomCard>

      {/* Alarm & Ringtone Section */}
      <Text style={styles.sectionHeader}>Alarm & Sound Settings</Text>
      <CustomCard style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.settingLabel}>Alarm Sound</Text>
            <Text style={styles.settingDesc}>Play ringtone when dose reminder arrives</Text>
          </View>
          <Switch
            value={alarmSoundEnabled}
            onValueChange={handleToggleAlarmSound}
            trackColor={{ false: THEME.colors.surfaceBorder, true: THEME.colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {alarmSoundEnabled && (
          <>
            <View style={styles.divider} />
            <CustomDropdown
              label="Selected Ringtone"
              items={RINGTONE_OPTIONS}
              value={ringtone}
              onSelect={handleSelectRingtone}
            />

            <CustomButton
              title="▶ Test Alarm Ringtone"
              variant="outline"
              size="sm"
              onPress={handleTestAlarm}
              style={styles.testBtn}
            />
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.settingLabel}>Vibrate on Alarm</Text>
            <Text style={styles.settingDesc}>Vibrate device alongside alarm sound</Text>
          </View>
          <Switch
            value={vibrate}
            onValueChange={handleToggleVibrate}
            trackColor={{ false: THEME.colors.surfaceBorder, true: THEME.colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.divider} />

        <CustomDropdown
          label="Default Snooze Duration"
          items={SNOOZE_OPTIONS}
          value={snoozeMinutes}
          onSelect={handleSelectSnooze}
        />
      </CustomCard>

      {/* Notifications Section */}
      <Text style={styles.sectionHeader}>Notification Preferences</Text>
      <CustomCard style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.settingLabel}>Medication Push Reminders</Text>
            <Text style={styles.settingDesc}>Receive alert notifications for upcoming doses</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: THEME.colors.surfaceBorder, true: THEME.colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </CustomCard>

      {/* Prominent Red Logout Button */}
      <View style={styles.logoutContainer}>
        <CustomButton
          title="🚪 Sign Out of MedApp"
          variant="danger"
          size="lg"
          onPress={() => setShowLogoutModal(true)}
        />
      </View>

      {/* Logout Confirmation Modal */}
      <CustomModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
        footer={
          <>
            <CustomButton
              title="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setShowLogoutModal(false)}
            />
            <CustomButton
              title="Yes, Sign Out"
              variant="danger"
              size="sm"
              onPress={() => {
                setShowLogoutModal(false);
                logout();
              }}
            />
          </>
        }
      >
        <Text style={styles.confirmText}>
          Are you sure you want to sign out? Your offline scheduled reminders will remain saved on this device.
        </Text>
      </CustomModal>
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
    paddingBottom: 60,
  },
  title: {
    ...THEME.typography.headerLarge,
    fontSize: 24,
    color: THEME.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
  },
  card: {
    padding: 16,
    marginBottom: THEME.spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  emergencyBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  emergencyLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.danger,
    marginBottom: 2,
  },
  emergencyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  settingDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.surfaceBorder,
    marginVertical: 12,
  },
  testBtn: {
    marginTop: 10,
  },
  logoutContainer: {
    marginTop: 16,
  },
  confirmText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
});
