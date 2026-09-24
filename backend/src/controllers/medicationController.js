import * as medicationService from '../services/medicationService.js';
import { successResponse } from '../utils/apiResponse.js';

export const createMedication = async (req, res, next) => {
  try {
    const result = await medicationService.createMedication(req.body, req.user._id);
    return successResponse(res, 'Medication and schedule created successfully', result, 201);
  } catch (err) {
    next(err);
  }
};

export const getMedications = async (req, res, next) => {
  try {
    const elderlyId = req.query.elderlyId || req.user._id;
    const medications = await medicationService.getMedicationsForElderly(elderlyId);
    return successResponse(res, 'Medications retrieved successfully', medications, 200);
  } catch (err) {
    next(err);
  }
};

export const getMedicationById = async (req, res, next) => {
  try {
    const medication = await medicationService.getMedicationById(req.params.id);
    return successResponse(res, 'Medication details retrieved successfully', medication, 200);
  } catch (err) {
    next(err);
  }
};

export const updateMedication = async (req, res, next) => {
  try {
    const result = await medicationService.updateMedication(req.params.id, req.body, req.user._id);
    return successResponse(res, 'Medication updated successfully', result, 200);
  } catch (err) {
    next(err);
  }
};

export const archiveMedication = async (req, res, next) => {
  try {
    const result = await medicationService.archiveMedication(req.params.id, req.user._id);
    return successResponse(res, 'Medication archived successfully', result, 200);
  } catch (err) {
    next(err);
  }
};

export const refillMedication = async (req, res, next) => {
  try {
    const { refillAmount } = req.body;
    const result = await medicationService.refillMedicationStock(req.params.id, refillAmount, req.user._id);
    return successResponse(res, 'Medication stock refilled successfully', result, 200);
  } catch (err) {
    next(err);
  }
};
