import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileDoseItem, OfflineDoseAction, DoseActionType } from '../types/dose';

const DOSES_CACHE_KEY = '@CareSync:todayDoses';
const OFFLINE_QUEUE_KEY = '@CareSync:offlineActionQueue';

export const cacheTodayDoses = async (doses: MobileDoseItem[]): Promise<void> => {
  await AsyncStorage.setItem(DOSES_CACHE_KEY, JSON.stringify(doses));
};

export const getCachedTodayDoses = async (): Promise<MobileDoseItem[]> => {
  const data = await AsyncStorage.getItem(DOSES_CACHE_KEY);
  return data ? JSON.parse(data) : [];
};

export const enqueueOfflineAction = async (
  doseId: string,
  action: DoseActionType,
  options?: { snoozeDurationMinutes?: number; skipReason?: string }
): Promise<OfflineDoseAction> => {
  const queue = await getOfflineActionQueue();
  const newAction: OfflineDoseAction = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    doseId,
    action,
    timestamp: new Date().toISOString(),
    snoozeDurationMinutes: options?.snoozeDurationMinutes,
    skipReason: options?.skipReason,
    synced: false
  };

  queue.push(newAction);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

  // Also optimistically update local cached dose
  const cachedDoses = await getCachedTodayDoses();
  const updatedDoses = cachedDoses.map((d) => {
    if (d._id === doseId) {
      return {
        ...d,
        status: action === 'TAKEN' ? 'taken' : action === 'SKIPPED' ? 'skipped' : 'snoozed'
      } as MobileDoseItem;
    }
    return d;
  });
  await cacheTodayDoses(updatedDoses);

  return newAction;
};

export const getOfflineActionQueue = async (): Promise<OfflineDoseAction[]> => {
  const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  return data ? JSON.parse(data) : [];
};

export const removeOfflineAction = async (actionId: string): Promise<void> => {
  const queue = await getOfflineActionQueue();
  const updated = queue.filter((a) => a.id !== actionId);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
};

export const clearOfflineQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
};
