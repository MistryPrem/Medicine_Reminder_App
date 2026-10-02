import api from './api';

export interface DeviceTokenPayload {
  fcmToken: string;
  devicePlatform: 'web' | 'android' | 'ios';
}

export const registerDeviceTokenApi = async (fcmToken: string, devicePlatform: 'web' | 'android' | 'ios' = 'web') => {
  const response = await api.post('/notifications/register-device', {
    fcmToken,
    devicePlatform
  });
  return response.data;
};

export const unregisterDeviceTokenApi = async (fcmToken: string) => {
  const response = await api.delete('/notifications/unregister-device', {
    data: { fcmToken }
  });
  return response.data;
};
