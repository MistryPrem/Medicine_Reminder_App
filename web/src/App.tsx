import React from 'react';

export const App: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        maxWidth: '540px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          CareSync Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '24px' }}>
          Elderly Medicine Reminder & Caregiver Monitoring System
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--success)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '14px',
          fontWeight: 600
        }}>
          ● Web Client Initialized (React + TypeScript)
        </div>
      </div>
    </div>
  );
};

export default App;
