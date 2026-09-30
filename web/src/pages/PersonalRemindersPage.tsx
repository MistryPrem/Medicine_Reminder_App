import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { DoseItemCard } from '../components/DoseItemCard';
import { AddMedicationModal } from '../components/AddMedicationModal';
import { DoseItem, CreateMedicationPayload } from '../types/medication';
import { useAuth } from '../hooks/useAuth';
import * as doseService from '../services/doseService';
import * as medicationService from '../services/medicationService';
import { Plus, BellRing, Pill } from 'lucide-react';

export const PersonalRemindersPage: React.FC = () => {
  const { user } = useAuth();
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoses = useCallback(async () => {
    try {
      const todayDoses = await doseService.getTodayDosesApi();
      setDoses(todayDoses);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading schedule';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoses();
  }, [loadDoses]);

  const handleTake = async (doseId: string) => {
    await doseService.recordDoseActionApi(doseId, 'TAKEN');
    await loadDoses();
  };

  const handleSnooze = async (doseId: string, minutes: number) => {
    await doseService.recordDoseActionApi(doseId, 'SNOOZED', { snoozeDurationMinutes: minutes });
    await loadDoses();
  };

  const handleSkip = async (doseId: string, reason?: string) => {
    await doseService.recordDoseActionApi(doseId, 'SKIPPED', { skipReason: reason });
    await loadDoses();
  };

  const handleCreateMedication = async (payload: CreateMedicationPayload) => {
    await medicationService.createMedicationApi(payload);
    await loadDoses();
  };

  const pendingDoses = doses.filter((d) => d.status !== 'taken' && d.status !== 'skipped');
  const takenDoses = doses.filter((d) => d.status === 'taken');

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <div className="dashboard-header">
          <div>
            <h1>Personal Medication Reminders</h1>
            <p className="subtitle">
              Manage your daily medications, recurring alarms, and doses independently
            </p>
          </div>

          <div className="header-actions">
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={18} />
              <span>Add Medication & Alarm</span>
            </button>
          </div>
        </div>

        {/* Status banner */}
        <div className="personal-status-banner" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#172033',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BellRing size={24} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>
                Active Recurring Alarms
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
                Notifications and sounds are configured to alert you right at your scheduled times.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontWeight: 600,
              fontSize: '13px'
            }}>
              {takenDoses.length} Taken
            </span>
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '13px'
            }}>
              {pendingDoses.length} Pending
            </span>
          </div>
        </div>

        {error && <div className="form-error-banner" style={{ marginBottom: '20px' }}>{error}</div>}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your personal reminder schedule...</p>
          </div>
        ) : doses.length === 0 ? (
          <div className="empty-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Pill size={48} className="icon-empty" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h2>No Medication Reminders Scheduled Today</h2>
            <p style={{ maxWidth: '480px', margin: '0 auto 24px', color: '#94a3b8' }}>
              Add your daily prescription, vitamins, or supplements to receive automated alarms and track your doses.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-large">
              <Plus size={20} />
              <span>Create Your First Reminder</span>
            </button>
          </div>
        ) : (
          <div className="section-card">
            <div className="section-header">
              <h2>Today's Schedule & Alarms</h2>
              <span className="date-badge">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="dose-list-grid">
              {doses.map((dose) => (
                <DoseItemCard
                  key={dose._id}
                  dose={dose}
                  onTake={handleTake}
                  onSnooze={handleSnooze}
                  onSkip={handleSkip}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {user && (
        <AddMedicationModal
          elderlyId={user._id}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateMedication}
        />
      )}
    </div>
  );
};
