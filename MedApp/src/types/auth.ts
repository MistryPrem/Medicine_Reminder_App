export type UserRole = 'elderly' | 'caregiver' | 'individual' | 'admin';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string | null;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ElderlyProfile {
  _id: string;
  userId: string;
  inviteCode?: string;
  caregiverId?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
