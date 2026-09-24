import { z } from 'zod';

export const registerDeviceTokenSchema = z.object({
  body: z.object({
    fcmToken: z.string().min(10, 'Valid FCM token is required').trim(),
    devicePlatform: z.enum(['android', 'ios', 'web']).default('android')
  })
});

export const unregisterDeviceTokenSchema = z.object({
  body: z.object({
    fcmToken: z.string().min(10, 'Valid FCM token is required').trim()
  })
});
