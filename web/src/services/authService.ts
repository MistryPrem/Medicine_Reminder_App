import api from './api';
import { ApiResponse } from '../types/api';
import { AuthResponseData, LoginCredentials, RegisterData, User } from '../types/auth';

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponseData> => {
  const response = await api.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
  return response.data.data;
};

export const registerApi = async (data: RegisterData): Promise<AuthResponseData> => {
  const response = await api.post<ApiResponse<AuthResponseData>>('/auth/register', data);
  return response.data.data;
};

export const getMeApi = async (): Promise<User> => {
  const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return response.data.data.user;
};

export const logoutApi = async (refreshToken: string): Promise<void> => {
  await api.post('/auth/logout', { refreshToken });
};
