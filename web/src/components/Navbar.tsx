import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Pill, LayoutDashboard, Clock, LogOut, HeartPulse } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <HeartPulse size={24} color="#38bdf8" />
          </div>
          <div>
            <span className="brand-title">CareSync</span>
            <span className="brand-subtitle">Medicine & Care</span>
          </div>
        </Link>

        <nav className="navbar-nav">
          {user.role === 'caregiver' && (
            <>
              <Link to="/dashboard" className="nav-link">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/medications" className="nav-link">
                <Pill size={18} />
                <span>Medications</span>
              </Link>
            </>
          )}

          {user.role === 'elderly' && (
            <Link to="/elderly-portal" className="nav-link">
              <Clock size={20} />
              <span style={{ fontSize: '18px', fontWeight: 700 }}>Today's Pills</span>
            </Link>
          )}
        </nav>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className={`role-badge role-${user.role}`}>
              {user.role === 'caregiver' ? 'Caregiver' : user.role === 'elderly' ? 'Senior' : 'Admin'}
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
