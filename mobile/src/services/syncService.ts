import api from './api';
import {
  getOfflineActionQueue,
  removeOfflineAction,
  cacheTodayDoses,
  getCachedTodayDoses,
  enqueueOfflineAction,
} from '../storage/offlineDb';
import { MedicationDose, DoseActionType } from '../types/dose';

interface BackendDoseResponse {
  _id: string;
  scheduleId: string;
  medicationId: {
    _id: string;
    name: string;
    dosage: string;
    dosageUnit: string;
    instructions?: string;
    pillsPerDose: number;
    colorCode?: string;
  };
  scheduledFor: string;
  status: string;
}

export const syncOfflineActions = async (): Promise<{ syncedCount: number; remainingCount: number }> => {
  const queue = await getOfflineActionQueue();
  let syncedCount = 0;

  for (const item of queue) {
    try {
      await api.post(`/doses/${item.doseId}/action`, {
        action: item.action,
        skipReason: item.skipReason,
        snoozeDurationMinutes: item.snoozeDurationMinutes,
        wasOfflineSync: true,
      });

      await removeOfflineAction(item.id);
      syncedCount++;
    } catch (err: unknown) {
      const isNetworkError =
        err && typeof err === 'object' && 'message' in err && (err as { message: string }).message.includes('Network');
      if (isNetworkError) {
        break;
      }
      // If server rejected (e.g. 404), remove item to avoid permanently clogging queue
      await removeOfflineAction(item.id);
    }
  }

  const remaining = await getOfflineActionQueue();
  return { syncedCount, remainingCount: remaining.length };
};

export const fetchAndCacheTodayDoses = async (elderlyId?: string): Promise<MedicationDose[]> => {
  try {
    const url = elderlyId ? `/doses/today?elderlyId=${elderlyId}` : '/doses/today';
    const res = await api.get<{ data: BackendDoseResponse[] }>(url);
    const mapped: MedicationDose[] = (res.data.data || []).map((d: BackendDoseResponse) => ({
      _id: d._id,
      scheduleId: d.scheduleId,
      medicationId: d.medicationId,
      medicationName: d.medicationId?.name || 'Medication',
      dosageQuantity: d.medicationId?.dosage || '',
      dosageUnit: d.medicationId?.dosageUnit || '',
      instructions: d.medicationId?.instructions,
      scheduledFor: d.scheduledFor,
      scheduledAt: d.scheduledFor,
      status: d.status as MedicationDose['status'],
      pillsPerDose: d.medicationId?.pillsPerDose || 1,
    }));

    await cacheTodayDoses(mapped);
    return mapped;
  } catch {
    // If network fails, serve from local offline cache
    return getCachedTodayDoses();
  }
};

export const syncService = {
  recordDoseTaken: async (doseId: string): Promise<void> => {
    try {
      await api.post(`/doses/${doseId}/action`, {
        action: 'TAKEN',
      });
    } catch {
      await enqueueOfflineAction(doseId, 'TAKEN');
    }
  },

  snoozeDose: async (doseId: string, snoozeDurationMinutes: number = 15): Promise<void> => {
    try {
      await api.post(`/doses/${doseId}/action`, {
        action: 'SNOOZED',
        snoozeDurationMinutes,
      });
    } catch {
      await enqueueOfflineAction(doseId, 'SNOOZED', { snoozeDurationMinutes });
    }
  },

  skipDose: async (doseId: string, skipReason?: string): Promise<void> => {
    try {
      await api.post(`/doses/${doseId}/action`, {
        action: 'SKIPPED',
        skipReason,
      });
    } catch {
      await enqueueOfflineAction(doseId, 'SKIPPED', { skipReason });
    }
  },

  syncPendingQueue: async (): Promise<number> => {
    const { syncedCount } = await syncOfflineActions();
    return syncedCount;
  },
};
