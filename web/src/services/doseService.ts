import api from './api';
import { ApiResponse } from '../types/api';
import { DoseItem } from '../types/medication';

export const getTodayDosesApi = async (elderlyId?: string): Promise<DoseItem[]> => {
  const url = elderlyId ? `/doses/today?elderlyId=${elderlyId}` : '/doses/today';
  const response = await api.get<ApiResponse<DoseItem[]>>(url);
  return response.data.data;
};

export const recordDoseActionApi = async (
  doseId: string,
  action: 'TAKEN' | 'SKIPPED' | 'SNOOZED',
  options?: { skipReason?: string; snoozeDurationMinutes?: number }
): Promise<{ dose: DoseItem; currentStock: number }> => {
  const response = await api.post<ApiResponse<{ dose: DoseItem; currentStock: number }>>(
    `/doses/${doseId}/action`,
    {
      action,
      ...options
    }
  );
  return response.data.data;
};
