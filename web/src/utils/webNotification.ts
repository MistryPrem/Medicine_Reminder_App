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
 * Displays a local browser notification if permitted
 */
export function showLocalNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      badge: '/vite.svg',
      icon: '/vite.svg',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (e) {
    console.error('[Notifications] Failed to display notification:', e);
    return null;
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
