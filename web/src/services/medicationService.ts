import api from './api';
import { ApiResponse } from '../types/api';
import { Medication, CreateMedicationPayload } from '../types/medication';

export const getMedicationsApi = async (elderlyId?: string): Promise<Medication[]> => {
  const url = elderlyId ? `/medications?elderlyId=${elderlyId}` : '/medications';
  const response = await api.get<ApiResponse<Medication[]>>(url);
  return response.data.data;
};

export const createMedicationApi = async (
  payload: CreateMedicationPayload
): Promise<{ medication: Medication }> => {
  const response = await api.post<ApiResponse<{ medication: Medication }>>('/medications', payload);
  return response.data.data;
};

export const refillMedicationApi = async (
  medicationId: string,
  refillAmount: number
): Promise<{ currentStock: number }> => {
  const response = await api.patch<ApiResponse<{ currentStock: number }>>(
    `/medications/${medicationId}/refill`,
    { refillAmount }
  );
  return response.data.data;
};

export const archiveMedicationApi = async (medicationId: string): Promise<void> => {
  await api.delete(`/medications/${medicationId}`);
};
