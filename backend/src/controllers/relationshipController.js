import * as relationshipService from '../services/relationshipService.js';
import { successResponse } from '../utils/apiResponse.js';

export const createInvitation = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const result = await relationshipService.generateInviteCode(req.user._id, permissions);
    return successResponse(res, 'Caregiver invitation code generated successfully', result, 201);
  } catch (err) {
    next(err);
  }
};

export const linkElderly = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const result = await relationshipService.linkElderlyWithCode(req.user._id, inviteCode);
    return successResponse(res, 'Successfully linked with caregiver', result, 200);
  } catch (err) {
    next(err);
  }
};

export const getCaregiverElderlyList = async (req, res, next) => {
  try {
    const list = await relationshipService.getLinkedElderlyForCaregiver(req.user._id);
    return successResponse(res, 'Linked elderly individuals retrieved successfully', list, 200);
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await relationshipService.getElderlyProfile(req.user._id);
    return successResponse(res, 'Profile retrieved successfully', profile, 200);
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await relationshipService.updateElderlyProfile(req.user._id, req.body, req.user._id);
    return successResponse(res, 'Profile updated successfully', profile, 200);
  } catch (err) {
    next(err);
  }
};

export const getElderlyProfileById = async (req, res, next) => {
  try {
    const profile = await relationshipService.getElderlyProfile(req.params.elderlyId);
    return successResponse(res, 'Elderly profile retrieved successfully', profile, 200);
  } catch (err) {
    next(err);
  }
};
