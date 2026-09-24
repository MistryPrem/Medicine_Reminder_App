import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { DoseItemCard } from '../components/DoseItemCard';
import { InviteCodeModal } from '../components/InviteCodeModal';
import { AddMedicationModal } from '../components/AddMedicationModal';
import { LinkedElderly } from '../types/relationship';
import { DoseItem, CreateMedicationPayload } from '../types/medication';
import * as relationshipService from '../services/relationshipService';
import * as doseService from '../services/doseService';
import * as medicationService from '../services/medicationService';
import { Users, CheckCircle2, Clock, AlertTriangle, Plus, UserPlus } from 'lucide-react';

export const CaregiverDashboardPage: React.FC = () => {
  const [elderlyList, setElderlyList] = useState<LinkedElderly[]>([]);
  const [selectedElderlyId, setSelectedElderlyId] = useState<string | null>(null);
  const [todayDoses, setTodayDoses] = useState<DoseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  // Load linked seniors
  const loadElderlyList = useCallback(async () => {
    try {
      const list = await relationshipService.getCaregiverElderlyListApi();
      setElderlyList(list);
      if (list.length > 0 && !selectedElderlyId) {
        setSelectedElderlyId(list[0].elderly._id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedElderlyId]);

  useEffect(() => {
    loadElderlyList();
  }, [loadElderlyList]);

  // Load today's doses for currently selected senior
  const loadTodayDoses = useCallback(async () => {
    if (!selectedElderlyId) return;
    try {
      const doses = await doseService.getTodayDosesApi(selectedElderlyId);
      setTodayDoses(doses);
    } catch {
      setTodayDoses([]);
    }
  }, [selectedElderlyId]);

  useEffect(() => {
    loadTodayDoses();
  }, [loadTodayDoses]);

  const handleTakeDose = async (doseId: string) => {
    await doseService.recordDoseActionApi(doseId, 'TAKEN');
    await loadTodayDoses();
  };

  const handleSnoozeDose = async (doseId: string, minutes: number) => {
    await doseService.recordDoseActionApi(doseId, 'SNOOZED', { snoozeDurationMinutes: minutes });
    await loadTodayDoses();
  };

  const handleSkipDose = async (doseId: string, reason?: string) => {
    await doseService.recordDoseActionApi(doseId, 'SKIPPED', { skipReason: reason });
    await loadTodayDoses();
  };

  const handleCreateMedication = async (payload: CreateMedicationPayload) => {
    await medicationService.createMedicationApi(payload);
    await loadTodayDoses();
  };

  // Metrics
  const totalDoses = todayDoses.length;
  const takenDoses = todayDoses.filter((d) => d.status === 'taken').length;
  const pendingDoses = todayDoses.filter((d) => d.status === 'scheduled' || d.status === 'reminder_sent').length;
  const missedDoses = todayDoses.filter((d) => d.status === 'missed').length;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  const currentSenior = elderlyList.find((e) => e.elderly._id === selectedElderlyId)?.elderly;

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <div className="dashboard-header">
          <div>
            <h1>Caregiver Overview</h1>
            <p className="subtitle">Real-time medication adherence & schedule monitoring</p>
          </div>

          <div className="header-actions">
            <button onClick={() => setShowInviteModal(true)} className="btn-secondary">
              <UserPlus size={18} />
              <span>Link Senior</span>
            </button>
            {selectedElderlyId && (
              <button onClick={() => setShowAddMedModal(true)} className="btn-primary">
                <Plus size={18} />
                <span>Add Medication</span>
              </button>
            )}
          </div>
        </div>

        {/* Senior Selector */}
        {elderlyList.length > 0 && (
          <div className="senior-selector-bar">
            <span className="selector-label">Currently Monitoring:</span>
            <div className="senior-tabs">
              {elderlyList.map((item) => (
                <button
                  key={item.elderly._id}
                  onClick={() => setSelectedElderlyId(item.elderly._id)}
                  className={`senior-tab ${selectedElderlyId === item.elderly._id ? 'tab-active' : ''}`}
                >
                  <Users size={16} />
                  <span>{item.elderly.fullName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading senior records...</p>
          </div>
        ) : elderlyList.length === 0 ? (
          <div className="empty-card">
            <Users size={48} className="icon-empty" />
            <h2>No Linked Senior Family Members Yet</h2>
            <p>Generate a 6-character connection code to link your elderly parent or loved one.</p>
            <button onClick={() => setShowInviteModal(true)} className="btn-primary btn-large">
              <UserPlus size={20} />
              <span>Generate Senior Pairing Code</span>
            </button>
          </div>
        ) : (
          <>
            {/* Metric Stat Cards */}
            <div className="stats-grid">
              <StatCard
                title="Today's Adherence"
                value={`${adherenceRate}%`}
                subtitle={`${takenDoses} of ${totalDoses} doses taken`}
                icon={CheckCircle2}
                variant={adherenceRate >= 80 ? 'success' : 'warning'}
              />
              <StatCard
                title="Pending Today"
                value={pendingDoses}
                subtitle="Awaiting senior confirmation"
                icon={Clock}
                variant="primary"
              />
              <StatCard
                title="Missed Doses"
                value={missedDoses}
                subtitle="Requires caregiver check-in"
                icon={AlertTriangle}
                variant={missedDoses > 0 ? 'danger' : 'success'}
              />
            </div>

            {/* Today's Schedule Timeline */}
            <div className="section-card">
              <div className="section-header">
                <h2>Today's Medication Timeline: {currentSenior?.fullName}</h2>
                <span className="date-badge">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>

              {todayDoses.length === 0 ? (
                <div className="empty-timeline">
                  <Clock size={36} color="#64748b" />
                  <p>No medication doses scheduled for today.</p>
                </div>
              ) : (
                <div className="dose-list-grid">
                  {todayDoses.map((dose) => (
                    <DoseItemCard
                      key={dose._id}
                      dose={dose}
                      onTake={handleTakeDose}
                      onSnooze={handleSnoozeDose}
                      onSkip={handleSkipDose}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <InviteCodeModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          loadElderlyList();
        }}
      />

      {selectedElderlyId && (
        <AddMedicationModal
          elderlyId={selectedElderlyId}
          isOpen={showAddMedModal}
          onClose={() => setShowAddMedModal(false)}
          onSubmit={handleCreateMedication}
        />
      )}
    </div>
  );
};
