import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// On physical Android devices connected via USB, 'adb reverse tcp:5000 tcp:5000' routes http://localhost:5000 directly.
// For Android emulator, 10.0.2.2 is also supported.
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://localhost:5000' : 'http://localhost:5000';
export const API_BASE_URL = `${DEFAULT_HOST}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);
};

export const clearAuthTokens = async (): Promise<void> => {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
};

// Request interceptor with comprehensive console & DevTools logging
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    const safeData = config.data ? { ...config.data } : undefined;
    if (safeData && safeData.password) safeData.password = '[REDACTED]';

    console.log(`📡 [API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`, {
      method: config.method?.toUpperCase(),
      url: fullUrl,
      params: config.params,
      data: safeData,
      headers: config.headers
    });

    return config;
  },
  (error: AxiosError) => {
    console.error(`❌ [API REQUEST ERROR]`, error);
    return Promise.reject(error);
  }
);

// Response interceptor with auto-refresh mechanism and full logging
api.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    console.log(
      `✅ [API SUCCESS] ${response.config.method?.toUpperCase()} ${fullUrl} | Status: ${response.status}`,
      {
        status: response.status,
        url: fullUrl,
        data: response.data
      }
    );
    return response;
  },
  async (error: AxiosError) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    const status = error.response?.status;
    const responseData = error.response?.data;

    console.warn(
      `⚠️ [API ERROR] ${error.config?.method?.toUpperCase()} ${fullUrl} | Status: ${status || 'NETWORK_FAILED'}`,
      {
        message: error.message,
        status,
        url: fullUrl,
        response: responseData,
        code: error.code
      }
    );

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          await clearAuthTokens();
          return Promise.reject(error);
        }

        const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = refreshRes.data.data.accessToken;
        const newRefreshToken = refreshRes.data.data.refreshToken;

        await setAuthTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        await clearAuthTokens();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
