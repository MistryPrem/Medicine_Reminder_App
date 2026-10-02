import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Pill, LayoutDashboard, Clock, LogOut, HeartPulse, Menu, X, Bell, BellOff } from 'lucide-react';
import { formatTo12HourTime, DEFAULT_TIMEZONE } from '../utils/timeFormat';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  NotificationPermissionState
} from '../utils/webNotification';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [notifState, setNotifState] = useState<NotificationPermissionState>('default');

  const effectiveTz = user?.timezone || DEFAULT_TIMEZONE;

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotifState(getNotificationPermission());
    }
  }, []);

  const handleRequestNotif = async () => {
    const res = await requestNotificationPermission();
    setNotifState(res);
  };

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatTo12HourTime(new Date(), effectiveTz));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [effectiveTz]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <div className="brand-icon">
              <HeartPulse size={24} color="#38bdf8" />
            </div>
            <div>
              <span className="brand-title">CareSync</span>
              <span className="brand-subtitle">Medicine & Care</span>
            </div>
          </Link>
        </div>

        <nav className={`navbar-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          {user.role === 'caregiver' && (
            <>
              <Link to="/dashboard" className="nav-link" onClick={closeMenu}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/medications" className="nav-link" onClick={closeMenu}>
                <Pill size={18} />
                <span>Medications</span>
              </Link>
            </>
          )}

          {user.role === 'individual' && (
            <>
              <Link to="/personal-reminders" className="nav-link" onClick={closeMenu}>
                <Clock size={18} />
                <span>Today's Reminders</span>
              </Link>
              <Link to="/medications" className="nav-link" onClick={closeMenu}>
                <Pill size={18} />
                <span>My Medications & Alarms</span>
              </Link>
            </>
          )}

          {user.role === 'elderly' && (
            <Link to="/elderly-portal" className="nav-link" onClick={closeMenu}>
              <Clock size={20} />
              <span style={{ fontSize: '18px', fontWeight: 700 }}>Today's Pills</span>
            </Link>
          )}

          {/* Mobile-only user actions inside drawer */}
          <div className="nav-mobile-footer">
            <div className="time-badge mobile-only">
              <Clock size={14} />
              <span>{currentTime} (IST)</span>
            </div>
            <button onClick={handleLogout} className="btn-mobile-logout">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        <div className="navbar-user">
          {/* Live time indicator */}
          <div className="navbar-clock desktop-only" title={`Current time in ${effectiveTz === 'Asia/Kolkata' ? 'Indian Standard Time (IST)' : effectiveTz}`}>
            <Clock size={15} className="clock-icon" />
            <span className="clock-time">{currentTime}</span>
            <span className="clock-zone">IST</span>
          </div>

          {/* Notification bell button */}
          <button
            onClick={handleRequestNotif}
            className={`btn-navbar-notif ${notifState === 'granted' ? 'notif-active' : notifState === 'denied' ? 'notif-blocked' : 'notif-pending'}`}
            title={
              notifState === 'granted'
                ? 'Notifications enabled'
                : notifState === 'denied'
                ? 'Notifications blocked in browser. Click to see instructions'
                : 'Click to enable browser notifications & alarms'
            }
            aria-label="Browser notification settings"
          >
            {notifState === 'denied' ? <BellOff size={18} /> : <Bell size={18} />}
            {notifState !== 'granted' && <span className="notif-pulse-dot" />}
          </button>

          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className={`role-badge role-${user.role}`}>
              {user.role === 'caregiver' ? 'Caregiver' : user.role === 'elderly' ? 'Senior' : user.role === 'individual' ? 'Personal' : 'Admin'}
            </span>
          </div>

          <button onClick={handleLogout} className="btn-logout" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
