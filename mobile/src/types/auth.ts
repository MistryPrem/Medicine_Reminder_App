export type UserRole = 'elderly' | 'caregiver' | 'admin';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  name?: string;
  role: UserRole;
  phoneNumber?: string | null;
  timezone?: string;
}

export interface ElderlyProfile {
  _id?: string;
  userId: string;
  emergencyContactPhone?: string | null;
  emergencyContactName?: string | null;
  medicalNotes?: string;
  preferredSnoozeMinutes?: number;
  highContrastMode?: boolean;
  largeFontMode?: boolean;
  primaryCaregiverId?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}
