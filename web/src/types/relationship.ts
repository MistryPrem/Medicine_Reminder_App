import { User } from './auth';

export interface ElderlyProfile {
  _id: string;
  userId: string;
  emergencyContactPhone?: string | null;
  emergencyContactName?: string | null;
  medicalNotes?: string;
  preferredSnoozeMinutes: number;
  highContrastMode: boolean;
  largeFontMode: boolean;
}

export interface LinkedElderly {
  relationshipId: string;
  permissions: 'full' | 'view_only';
  connectedAt: string;
  elderly: User & {
    profile?: ElderlyProfile | null;
  };
}

export interface InviteCodeResponse {
  inviteCode: string;
  inviteExpiresAt: string;
  permissions: string;
}
