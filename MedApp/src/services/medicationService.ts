import { api } from './api';

export interface CreateMedicationPayload {
  elderlyId: string;
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit: 'mg' | 'ml' | 'tablet' | 'capsule' | 'drop' | 'patch';
  instructions?: string;
  currentStock?: number;
  refillThreshold?: number;
  pillsPerDose?: number;
  colorCode?: string;
  schedule: {
    frequencyType: 'daily' | 'twice_daily' | 'thrice_daily' | 'weekly' | 'custom' | 'as_needed';
    scheduledTimes: string[]; // e.g. ["08:00", "20:00"]
    daysOfWeek?: number[];
    startDate?: string;
    endDate?: string | null;
    alarmSound?: 'chime' | 'gentle_bell' | 'radar' | 'digital_alarm' | 'melody' | 'soft_harp';
    isAlarmEnabled?: boolean;
    vibrate?: boolean;
  };
}

export const createMedication = async (payload: CreateMedicationPayload) => {
  const response = await api.post('/medications', payload);
  return response.data?.data?.medication || response.data?.data;
};

export const getMedications = async (elderlyId?: string) => {
  const params = elderlyId ? { elderlyId } : {};
  const response = await api.get('/medications', { params });
  return response.data?.data?.medications || [];
};

export const deleteMedication = async (id: string) => {
  const response = await api.delete(`/medications/${id}`);
  return response.data;
};
