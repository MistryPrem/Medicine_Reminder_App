import api from './api';
import { ApiResponse } from '../types/api';
import { LinkedElderly, InviteCodeResponse, ElderlyProfile } from '../types/relationship';

export const getCaregiverElderlyListApi = async (): Promise<LinkedElderly[]> => {
  const response = await api.get<ApiResponse<LinkedElderly[]>>('/caregivers/elderly-list');
  return response.data.data;
};

export const createCaregiverInviteApi = async (
  permissions: 'full' | 'view_only' = 'full'
): Promise<InviteCodeResponse> => {
  const response = await api.post<ApiResponse<InviteCodeResponse>>('/caregivers/invitations', {
    permissions
  });
  return response.data.data;
};

export const linkElderlyApi = async (inviteCode: string): Promise<void> => {
  await api.post('/elderly/link', { inviteCode });
};

export const getMyElderlyProfileApi = async (): Promise<ElderlyProfile> => {
  const response = await api.get<ApiResponse<ElderlyProfile>>('/elderly/my-profile');
  return response.data.data;
};
