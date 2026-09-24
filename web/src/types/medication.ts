export type DosageUnit =
  | 'mg'
  | 'ml'
  | 'tablet'
  | 'capsule'
  | 'drops'
  | 'puff'
  | 'patch'
  | 'units'
  | 'sachet';

export type FrequencyType = 'once_daily' | 'multiple_daily' | 'specific_days' | 'interval';

export type DoseStatus =
  | 'scheduled'
  | 'reminder_sent'
  | 'taken'
  | 'snoozed'
  | 'skipped'
  | 'missed';

export interface MedicationSchedule {
  _id: string;
  medicationId: string;
  elderlyId: string;
  frequencyType: FrequencyType;
  scheduledTimes: string[];
  daysOfWeek?: number[];
  intervalHours?: number | null;
  startDate: string;
  endDate?: string | null;
  timezone: string;
  isActive: boolean;
}

export interface Medication {
  _id: string;
  elderlyId: string;
  createdBy: string;
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit: DosageUnit;
  instructions?: string;
  currentStock: number;
  refillThreshold: number;
  pillsPerDose: number;
  colorCode: string;
  isActive: boolean;
  schedule?: MedicationSchedule | null;
  createdAt: string;
  updatedAt: string;
}

export interface DoseItem {
  _id: string;
  scheduleId: string;
  medicationId: {
    _id: string;
    name: string;
    genericName?: string;
    dosage: string;
    dosageUnit: DosageUnit;
    instructions?: string;
    currentStock: number;
    refillThreshold: number;
    colorCode: string;
    pillsPerDose: number;
  };
  elderlyId: string;
  scheduledFor: string;
  status: DoseStatus;
  statusUpdatedAt: string;
  reminderSentAt?: string | null;
  overdueThresholdAt: string;
}

export interface CreateMedicationPayload {
  elderlyId: string;
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit: DosageUnit;
  instructions?: string;
  currentStock: number;
  refillThreshold: number;
  pillsPerDose: number;
  colorCode?: string;
  schedule: {
    frequencyType: FrequencyType;
    scheduledTimes: string[];
    daysOfWeek?: number[];
    intervalHours?: number;
    startDate?: string;
    endDate?: string | null;
    timezone?: string;
  };
}
