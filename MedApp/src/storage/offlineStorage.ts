import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicationDose } from '../types/dose';

const TODAY_DOSES_KEY = '@MedApp:today_doses';
const OFFLINE_QUEUE_KEY = '@MedApp:offline_action_queue';

export interface QueuedAction {
  id: string;
  doseId: string;
  action: 'take' | 'snooze' | 'skip';
  payload?: any;
  timestamp: string;
}

export const saveTodayDosesLocally = async (doses: MedicationDose[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(TODAY_DOSES_KEY, JSON.stringify(doses));
  } catch (error) {
    console.error('Failed to save doses locally:', error);
  }
};

export const getLocalTodayDoses = async (): Promise<MedicationDose[]> => {
  try {
    const raw = await AsyncStorage.getItem(TODAY_DOSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to read local doses:', error);
    return [];
  }
};

export const enqueueAction = async (action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const currentQueue = await getOfflineQueue();
    const newEntry: QueuedAction = {
      ...action,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    currentQueue.push(newEntry);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(currentQueue));
  } catch (error) {
    console.error('Failed to enqueue offline action:', error);
  }
};

export const getOfflineQueue = async (): Promise<QueuedAction[]> => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to fetch offline queue:', error);
    return [];
  }
};

export const clearActionFromQueue = async (actionId: string): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to clear action from queue:', error);
  }
};
