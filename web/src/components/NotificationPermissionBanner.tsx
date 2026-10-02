import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  NotificationPermissionState
} from '../utils/webNotification';

export const NotificationPermissionBanner: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [dismissed, setDismissed] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    setPermission(getNotificationPermission());

    const isDismissed = sessionStorage.getItem('care_notif_banner_dismissed') === 'true';
    if (isDismissed) setDismissed(true);
  }, []);

  if (!isNotificationSupported() || permission === 'granted' || dismissed) {
    return null;
  }

  const handleEnableNotifications = async () => {
    setIsPrompting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
    } finally {
      setIsPrompting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('care_notif_banner_dismissed', 'true');
  };

  return (
    <div className="notification-permission-bar">
      <div className="notification-banner-content">
        <div className="notif-icon-circle">
          {permission === 'denied' ? <BellOff size={18} /> : <Bell size={18} />}
        </div>
        <div className="notif-text-group">
          <strong>
            {permission === 'denied'
              ? 'Notifications are blocked in your browser'
              : 'Enable Medication Reminders & Alarms'}
          </strong>
          <span>
            {permission === 'denied'
              ? 'To get audible pill alarms, click the lock icon 🔒 next to the URL and set Notifications to "Allow".'
              : 'Allow notifications so Chrome can alert you the moment a dose is due, even if this tab is in the background.'}
          </span>
        </div>
      </div>

      <div className="notif-banner-actions">
        {permission !== 'denied' && (
          <button
            onClick={handleEnableNotifications}
            disabled={isPrompting}
            className="btn-enable-notif"
          >
            <Bell size={15} />
            <span>{isPrompting ? 'Requesting...' : 'Allow Notifications'}</span>
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="btn-dismiss-notif"
          aria-label="Dismiss banner"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
