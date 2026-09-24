import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import * as authService from '../src/services/authService.js';
import { env } from '../src/config/env.js';
import { authorize } from '../src/middleware/rbacMiddleware.js';
import { ROLES } from '../src/constants/roles.js';

describe('Authentication Subsystem Tests', () => {
  describe('JWT Token Generation', () => {
    it('should generate valid access token containing user claims', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'caregiver@example.com',
        role: ROLES.CAREGIVER
      };

      const token = authService.generateAccessToken(mockUser);
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });
  });

  describe('User Registration Service', () => {
    it('should reject registration if email is already registered', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValueOnce({ _id: '123', email: 'existing@example.com' });

      await expect(
        authService.registerUser({
          email: 'existing@example.com',
          password: 'Password123!',
          fullName: 'Test User'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        errorCode: 'CONFLICT'
      });

      User.findOne.mockRestore();
    });

    it('should register a new user successfully and return tokens', async () => {
      const mockCreatedUser = {
        _id: 'mock_user_id_123',
        email: 'newuser@example.com',
        fullName: 'Jane Doe',
        role: ROLES.CAREGIVER,
        toJSON: () => ({
          _id: 'mock_user_id_123',
          email: 'newuser@example.com',
          fullName: 'Jane Doe',
          role: ROLES.CAREGIVER
        })
      };

      jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(User, 'create').mockResolvedValueOnce(mockCreatedUser);
      jest.spyOn(RefreshToken, 'create').mockResolvedValueOnce({ _id: 'token_id' });

      const result = await authService.registerUser({
        email: 'newuser@example.com',
        password: 'Password123!',
        fullName: 'Jane Doe',
        role: ROLES.CAREGIVER
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user._id).toBe('mock_user_id_123');

      User.findOne.mockRestore();
      User.create.mockRestore();
      RefreshToken.create.mockRestore();
    });
  });

  describe('User Authentication Service', () => {
    it('should reject login if user not found', async () => {
      jest.spyOn(User, 'findOne').mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(null)
      });

      await expect(authService.authenticateUser('nonexistent@example.com', 'Password123!')).rejects.toMatchObject({
        statusCode: 401,
        errorCode: 'UNAUTHORIZED'
      });

      User.findOne.mockRestore();
    });

    it('should reject login if password does not match', async () => {
      const mockUser = {
        _id: '123',
        email: 'user@example.com',
        comparePassword: jest.fn().mockResolvedValueOnce(false)
      };

      jest.spyOn(User, 'findOne').mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockUser)
      });

      await expect(authService.authenticateUser('user@example.com', 'WrongPassword')).rejects.toMatchObject({
        statusCode: 401,
        errorCode: 'UNAUTHORIZED'
      });

      User.findOne.mockRestore();
    });

    it('should reject login if user account is deactivated', async () => {
      const mockUser = {
        _id: '123',
        email: 'user@example.com',
        isActive: false,
        comparePassword: jest.fn().mockResolvedValueOnce(true)
      };

      jest.spyOn(User, 'findOne').mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockUser)
      });

      await expect(authService.authenticateUser('user@example.com', 'CorrectPassword')).rejects.toMatchObject({
        statusCode: 403,
        errorCode: 'FORBIDDEN'
      });

      User.findOne.mockRestore();
    });
  });

  describe('Refresh Token Rotation & Security', () => {
    it('should reject refresh if token is not found in database', async () => {
      jest.spyOn(RefreshToken, 'findOne').mockResolvedValueOnce(null);

      await expect(authService.rotateRefreshToken('invalid_raw_token')).rejects.toMatchObject({
        statusCode: 401,
        errorCode: 'UNAUTHORIZED'
      });

      RefreshToken.findOne.mockRestore();
    });

    it('should rotate token: delete old token and issue fresh access + refresh token pair', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const mockStoredToken = {
        _id: 'stored_token_id',
        userId: 'user_123',
        expiresAt: futureDate
      };

      const mockActiveUser = {
        _id: 'user_123',
        email: 'user@example.com',
        role: ROLES.CAREGIVER,
        isActive: true
      };

      jest.spyOn(RefreshToken, 'findOne').mockResolvedValueOnce(mockStoredToken);
      jest.spyOn(RefreshToken, 'deleteOne').mockResolvedValueOnce({ acknowledged: true });
      jest.spyOn(RefreshToken, 'create').mockResolvedValueOnce({ _id: 'new_token_id' });
      jest.spyOn(User, 'findById').mockResolvedValueOnce(mockActiveUser);

      const tokens = await authService.rotateRefreshToken('valid_token_raw');

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ _id: 'stored_token_id' });

      RefreshToken.findOne.mockRestore();
      RefreshToken.deleteOne.mockRestore();
      RefreshToken.create.mockRestore();
      User.findById.mockRestore();
    });
  });

  describe('RBAC Middleware', () => {
    it('should allow user with authorized role', () => {
      const req = { user: { role: ROLES.CAREGIVER } };
      const res = {};
      const next = jest.fn();

      const middleware = authorize(ROLES.CAREGIVER, ROLES.ADMIN);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should forbid user with unauthorized role', () => {
      const req = { user: { role: ROLES.ELDERLY } };
      const res = {};
      const next = jest.fn();

      const middleware = authorize(ROLES.CAREGIVER);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          errorCode: 'FORBIDDEN'
        })
      );
    });
  });
});
