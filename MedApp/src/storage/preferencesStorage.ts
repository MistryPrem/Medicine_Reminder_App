import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlarmRingtone = 'gentle_bell' | 'chime' | 'radar' | 'melody' | 'digital_alarm';

export interface UserPreferences {
  notificationsEnabled: boolean;
  alarmSoundEnabled: boolean;
  ringtone: AlarmRingtone;
  vibrate: boolean;
  snoozeDurationMinutes: number;
}

const PREFERENCES_KEY = '@MedApp:user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  notificationsEnabled: true,
  alarmSoundEnabled: true,
  ringtone: 'gentle_bell',
  vibrate: true,
  snoozeDurationMinutes: 15,
};

export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

export const saveUserPreferences = async (prefs: Partial<UserPreferences>): Promise<UserPreferences> => {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};
