export type DoseStatus =
  | 'scheduled'
  | 'reminder_sent'
  | 'taken'
  | 'snoozed'
  | 'skipped'
  | 'missed';

export type DoseActionType = 'TAKEN' | 'SKIPPED' | 'SNOOZED';

export interface MedicationDose {
  _id: string;
  scheduleId: string;
  medicationId?: {
    _id: string;
    name: string;
    dosage: string;
    dosageUnit: string;
    instructions?: string;
    pillsPerDose: number;
    colorCode?: string;
  };
  medicationName?: string;
  dosageQuantity?: string;
  dosageUnit?: string;
  instructions?: string;
  scheduledFor: string;
  scheduledAt?: string;
  status: DoseStatus;
  statusUpdatedAt?: string;
  takenAt?: string;
  pillsPerDose?: number;
}

export type MobileDoseItem = MedicationDose;

export interface OfflineDoseAction {
  id: string;
  doseId: string;
  action: DoseActionType;
  timestamp: string;
  snoozeDurationMinutes?: number;
  skipReason?: string;
  synced: boolean;
}
