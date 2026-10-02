import { api } from './api';
import { MedicationDose } from '../types/dose';
import {
  enqueueAction,
  getOfflineQueue,
  clearActionFromQueue,
} from '../storage/offlineStorage';

export const getTodayDoses = async (): Promise<MedicationDose[]> => {
  const response = await api.get('/doses/today');
  return response.data.data;
};

export const markDoseTaken = async (doseId: string): Promise<MedicationDose> => {
  try {
    const response = await api.post(`/doses/${doseId}/take`);
    return response.data.data;
  } catch (error) {
    await enqueueAction({ doseId, action: 'take' });
    throw error;
  }
};

export const snoozeDose = async (doseId: string, durationMinutes: number = 15): Promise<MedicationDose> => {
  try {
    const response = await api.post(`/doses/${doseId}/snooze`, { durationMinutes });
    return response.data.data;
  } catch (error) {
    await enqueueAction({ doseId, action: 'snooze', payload: { durationMinutes } });
    throw error;
  }
};

export const skipDose = async (doseId: string, reason?: string): Promise<MedicationDose> => {
  try {
    const response = await api.post(`/doses/${doseId}/skip`, { reason });
    return response.data.data;
  } catch (error) {
    await enqueueAction({ doseId, action: 'skip', payload: { reason } });
    throw error;
  }
};

export const getDoseHistory = async (startDate?: string, endDate?: string): Promise<MedicationDose[]> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get('/doses/history', { params });
  return response.data.data;
};

export const flushOfflineQueue = async (): Promise<number> => {
  const queue = await getOfflineQueue();
  let processed = 0;

  for (const item of queue) {
    try {
      if (item.action === 'take') {
        await api.post(`/doses/${item.doseId}/take`);
      } else if (item.action === 'snooze') {
        await api.post(`/doses/${item.doseId}/snooze`, item.payload);
      } else if (item.action === 'skip') {
        await api.post(`/doses/${item.doseId}/skip`, item.payload);
      }
      await clearActionFromQueue(item.id);
      processed++;
    } catch (e) {
      console.warn(`Failed to sync queued action ${item.id}:`, e);
      break;
    }
  }

  return processed;
};
