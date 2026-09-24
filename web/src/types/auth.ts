export type UserRole = 'elderly' | 'caregiver' | 'admin';

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

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  phoneNumber?: string;
  timezone?: string;
}
