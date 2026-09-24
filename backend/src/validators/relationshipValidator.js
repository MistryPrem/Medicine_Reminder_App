import { z } from 'zod';

export const createInviteSchema = z.object({
  body: z.object({
    permissions: z.enum(['full', 'view_only']).default('full')
  })
});

export const linkElderlySchema = z.object({
  body: z.object({
    inviteCode: z
      .string()
      .min(6, 'Invite code must be at least 6 characters')
      .max(10)
      .trim()
      .toUpperCase()
  })
});

export const updateElderlyProfileSchema = z.object({
  body: z.object({
    emergencyContactPhone: z.string().optional(),
    emergencyContactName: z.string().max(100).optional(),
    medicalNotes: z.string().max(2000).optional(),
    preferredSnoozeMinutes: z.enum(['10', '15', '30', '60']).transform(Number).optional(),
    highContrastMode: z.boolean().optional(),
    largeFontMode: z.boolean().optional()
  })
});
