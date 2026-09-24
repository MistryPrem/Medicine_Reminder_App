import { Medication } from '../models/Medication.js';
import { MedicationSchedule } from '../models/MedicationSchedule.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export const createMedication = async (medicationData, creatorId) => {
  const { schedule: scheduleData, ...medDetails } = medicationData;

  // Retrieve elderly user to resolve default timezone
  const elderly = await User.findById(medDetails.elderlyId);
  if (!elderly || !elderly.isActive) {
    throw AppError.notFound('Elderly user not found or inactive', ERROR_CODES.NOT_FOUND);
  }

  // 1. Create Medication document
  const medication = await Medication.create({
    ...medDetails,
    createdBy: creatorId
  });

  // 2. Create MedicationSchedule document
  const schedule = await MedicationSchedule.create({
    ...scheduleData,
    medicationId: medication._id,
    elderlyId: medication.elderlyId,
    timezone: scheduleData.timezone || elderly.timezone || 'UTC'
  });

  // 3. Log event in AuditLog
  await AuditLog.create({
    actorId: creatorId,
    action: 'MEDICATION_CREATED',
    resourceType: 'MEDICATION',
    resourceId: medication._id,
    metadata: {
      name: medication.name,
      dosage: `${medication.dosage} ${medication.dosageUnit}`,
      frequencyType: schedule.frequencyType,
      times: schedule.scheduledTimes
    }
  });

  return {
    medication,
    schedule
  };
};

export const getMedicationsForElderly = async (elderlyId) => {
  const medications = await Medication.find({ elderlyId, isActive: true }).sort({ name: 1 }).lean();

  const results = [];
  for (const med of medications) {
    const schedule = await MedicationSchedule.findOne({ medicationId: med._id, isActive: true }).lean();
    results.push({
      ...med,
      schedule: schedule || null
    });
  }

  return results;
};

export const getMedicationById = async (medicationId) => {
  const medication = await Medication.findById(medicationId).lean();
  if (!medication || !medication.isActive) {
    throw AppError.notFound('Medication not found or archived', ERROR_CODES.NOT_FOUND);
  }

  const schedule = await MedicationSchedule.findOne({ medicationId, isActive: true }).lean();

  return {
    ...medication,
    schedule: schedule || null
  };
};

export const updateMedication = async (medicationId, updateData, actorId) => {
  const { schedule: scheduleData, ...medUpdates } = updateData;

  const medication = await Medication.findById(medicationId);
  if (!medication || !medication.isActive) {
    throw AppError.notFound('Medication not found or archived', ERROR_CODES.NOT_FOUND);
  }

  // Update Medication fields
  Object.assign(medication, medUpdates);
  await medication.save();

  let updatedSchedule = null;
  if (scheduleData) {
    updatedSchedule = await MedicationSchedule.findOneAndUpdate(
      { medicationId, isActive: true },
      { $set: scheduleData },
      { new: true, runValidators: true }
    );
  } else {
    updatedSchedule = await MedicationSchedule.findOne({ medicationId, isActive: true });
  }

  await AuditLog.create({
    actorId,
    action: 'MEDICATION_UPDATED',
    resourceType: 'MEDICATION',
    resourceId: medication._id,
    metadata: { updates: updateData }
  });

  return {
    medication,
    schedule: updatedSchedule
  };
};

export const archiveMedication = async (medicationId, actorId) => {
  const medication = await Medication.findById(medicationId);
  if (!medication || !medication.isActive) {
    throw AppError.notFound('Medication not found or already archived', ERROR_CODES.NOT_FOUND);
  }

  // Soft delete medication
  medication.isActive = false;
  await medication.save();

  // Deactivate schedules
  await MedicationSchedule.updateMany(
    { medicationId, isActive: true },
    { $set: { isActive: false } }
  );

  await AuditLog.create({
    actorId,
    action: 'MEDICATION_ARCHIVED',
    resourceType: 'MEDICATION',
    resourceId: medication._id,
    metadata: { name: medication.name }
  });

  return { success: true };
};

export const refillMedicationStock = async (medicationId, refillAmount, actorId) => {
  const medication = await Medication.findById(medicationId);
  if (!medication || !medication.isActive) {
    throw AppError.notFound('Medication not found or archived', ERROR_CODES.NOT_FOUND);
  }

  medication.currentStock += refillAmount;
  await medication.save();

  await AuditLog.create({
    actorId,
    action: 'MEDICATION_REFILLED',
    resourceType: 'MEDICATION',
    resourceId: medication._id,
    metadata: {
      addedAmount: refillAmount,
      newStock: medication.currentStock
    }
  });

  return {
    medicationId: medication._id,
    name: medication.name,
    currentStock: medication.currentStock,
    refillThreshold: medication.refillThreshold
  };
};
