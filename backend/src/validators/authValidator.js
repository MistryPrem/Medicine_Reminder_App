import { z } from 'zod';
import { ROLE_LIST } from '../constants/roles.js';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required').trim().toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters long').max(100).trim(),
    role: z.enum(ROLE_LIST).optional(),
    phoneNumber: z.string().optional(),
    timezone: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required')
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});
