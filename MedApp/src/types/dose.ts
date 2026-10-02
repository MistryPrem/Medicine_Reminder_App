export type DoseStatus = 'scheduled' | 'reminder_sent' | 'taken' | 'snoozed' | 'missed' | 'skipped';

export interface MedicationSchedule {
  _id: string;
  elderlyId: string;
  frequencyType: string;
  scheduledTimes: string[];
  alarmSound?: 'chime' | 'gentle_bell' | 'radar' | 'digital_alarm' | 'melody' | 'soft_harp';
  alarmVolume?: number;
  vibrate?: boolean;
  isAlarmEnabled?: boolean;
}

export interface Medication {
  _id: string;
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit: string;
  instructions?: string;
  colorCode?: string;
  pillsPerDose: number;
  currentStock: number;
  refillThreshold: number;
  schedule?: MedicationSchedule;
}

export interface MedicationDose {
  _id: string;
  medicationId: Medication;
  elderlyId: string;
  scheduledFor: string;
  status: DoseStatus;
  takenAt?: string;
  snoozedUntil?: string;
  skippedReason?: string;
  scheduleId?: MedicationSchedule;
}
