import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CaregiverDashboardPage } from '../pages/CaregiverDashboardPage';
import { MedicationManagementPage } from '../pages/MedicationManagementPage';
import { ElderlyPortalPage } from '../pages/ElderlyPortalPage';
import { PersonalRemindersPage } from '../pages/PersonalRemindersPage';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

export const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === 'elderly' ? '/elderly-portal' : '/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={user.role === 'elderly' ? '/elderly-portal' : '/dashboard'} replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Caregiver Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['caregiver', 'admin']} />}>
        <Route path="/dashboard" element={<CaregiverDashboardPage />} />
      </Route>

      {/* Medication Management (Caregivers, Individuals, Admins) */}
      <Route element={<ProtectedRoute allowedRoles={['caregiver', 'individual', 'admin']} />}>
        <Route path="/medications" element={<MedicationManagementPage />} />
      </Route>

      {/* Independent Adult Personal Reminders */}
      <Route element={<ProtectedRoute allowedRoles={['individual', 'admin']} />}>
        <Route path="/personal-reminders" element={<PersonalRemindersPage />} />
      </Route>

      {/* Senior Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['elderly', 'admin']} />}>
        <Route path="/elderly-portal" element={<ElderlyPortalPage />} />
      </Route>

      {/* Root Redirection */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === 'elderly' ? (
            <Navigate to="/elderly-portal" replace />
          ) : user.role === 'individual' ? (
            <Navigate to="/personal-reminders" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
