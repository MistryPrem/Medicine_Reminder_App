/**
 * Web Browser Push Notification & Audio Alarm Manager
 */
import { registerDeviceTokenApi } from '../services/notificationService';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

/**
 * Checks if the Web Notification API is supported by the browser
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission status
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests permission from the user in Chrome/Firefox/Safari.
 * Generates and registers a web device identifier with the backend upon approval.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    console.warn('[Notifications] Notifications are not supported in this browser.');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Create or retrieve persistent web client token
      let webToken = localStorage.getItem('care_web_device_token');
      if (!webToken) {
        webToken = 'web_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('care_web_device_token', webToken);
      }

      // Register device token with backend
      try {
        await registerDeviceTokenApi(webToken, 'web');
        console.log('[Notifications] Registered web notification token with backend.');
      } catch (err) {
        console.warn('[Notifications] Could not sync device token with backend:', err);
      }

      // Display initial confirmation toast notification
      showLocalNotification('CareSync Notifications Enabled', {
        body: 'You will now receive timely medication reminders and alerts right here on your browser!',
        icon: '/vite.svg',
        tag: 'welcome_notification'
      });
    }

    return permission;
  } catch (error) {
    console.error('[Notifications] Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Registers the background service worker if supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (e) {
      console.warn('[ServiceWorker] Registration failed:', e);
      return null;
    }
  }
  return null;
}

/**
 * Displays a local browser notification with sound and vibration
 */
export async function showLocalNotification(title: string, options?: NotificationOptions): Promise<Notification | void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  // Play auditory alert chime
  playAlarmSound('chime');

  const notifOptions: NotificationOptions = {
    badge: '/vite.svg',
    icon: '/vite.svg',
    requireInteraction: true,
    ...options
  };

  // Try showing via active service worker (standard in Chrome)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch (e) {
      console.warn('[Notifications] ServiceWorker showNotification failed, trying fallback:', e);
    }
  }

  // Fallback to classic window Notification constructor
  try {
    const notification = new Notification(title, notifOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return notification;
  } catch (e) {
    console.error('[Notifications] Direct Notification error:', e);
  }
}

/**
 * Plays a web audio alert sound for medicine alarms
 */
export function playAlarmSound(sound: string = 'chime') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = sound === 'radar' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(sound === 'radar' ? 880 : 587.33, ctx.currentTime); // D5 or A5
    osc.frequency.exponentialRampToValueAtTime(sound === 'radar' ? 440 : 880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn('[AlarmSound] Audio playback error:', err);
  }
}
