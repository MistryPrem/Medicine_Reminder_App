import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { DoseItemCard } from '../components/DoseItemCard';
import { DoseItem } from '../types/medication';
import { ElderlyProfile } from '../types/relationship';
import * as doseService from '../services/doseService';
import * as relationshipService from '../services/relationshipService';
import { PhoneCall, Link2, CheckCircle2 } from 'lucide-react';

export const ElderlyPortalPage: React.FC = () => {
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [profile, setProfile] = useState<ElderlyProfile | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [todayDoses, userProfile] = await Promise.all([
        doseService.getTodayDosesApi(),
        relationshipService.getMyElderlyProfileApi()
      ]);
      setDoses(todayDoses);
      setProfile(userProfile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading schedule';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTake = async (doseId: string) => {
    await doseService.recordDoseActionApi(doseId, 'TAKEN');
    await loadData();
  };

  const handleSnooze = async (doseId: string, minutes: number) => {
    await doseService.recordDoseActionApi(doseId, 'SNOOZED', { snoozeDurationMinutes: minutes });
    await loadData();
  };

  const handleSkip = async (doseId: string, reason?: string) => {
    await doseService.recordDoseActionApi(doseId, 'SKIPPED', { skipReason: reason });
    await loadData();
  };

  const handleLinkCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inviteCodeInput.trim()) return;

    try {
      setIsLinking(true);
      await relationshipService.linkElderlyApi(inviteCodeInput.trim().toUpperCase());
      setLinkSuccess(true);
      setInviteCodeInput('');
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Invalid or expired invite code';
      setError(errorMsg || 'Failed to connect');
    } finally {
      setIsLinking(false);
    }
  };

  const pendingDoses = doses.filter((d) => d.status !== 'taken' && d.status !== 'skipped');

  return (
    <div className="app-layout elderly-theme">
      <Navbar />

      <main className="main-content elderly-container">
        {/* Emergency Contact Banner */}
        {profile?.emergencyContactPhone && (
          <div className="emergency-banner">
            <div className="emergency-info">
              <PhoneCall size={28} className="icon-emergency" />
              <div>
                <span className="emergency-label">Emergency Caregiver Contact</span>
                <span className="emergency-name">
                  {profile.emergencyContactName || 'Caregiver'}: {profile.emergencyContactPhone}
                </span>
              </div>
            </div>
            <a href={`tel:${profile.emergencyContactPhone}`} className="btn-call-emergency">
              CALL NOW
            </a>
          </div>
        )}

        {/* Link Caregiver Box */}
        <div className="elderly-link-card">
          <div className="link-card-header">
            <Link2 size={24} color="#38bdf8" />
            <h3>Connect with Family Caregiver</h3>
          </div>
          {linkSuccess ? (
            <div className="link-success-banner">
              <CheckCircle2 size={20} color="#10b981" />
              <span>Successfully linked with your caregiver! Your medications will now synchronize automatically.</span>
            </div>
          ) : (
            <form onSubmit={handleLinkCaregiver} className="elderly-link-form">
              <input
                type="text"
                maxLength={10}
                placeholder="ENTER 6-DIGIT CODE"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                className="input-code-large"
              />
              <button type="submit" disabled={isLinking} className="btn-link-large">
                {isLinking ? 'CONNECTING...' : 'CONNECT'}
              </button>
            </form>
          )}
          {error && <div className="link-error-text">{error}</div>}
        </div>

        {/* Today's Medication Section */}
        <div className="elderly-doses-header">
          <h2>Today's Medications</h2>
          <span className="pending-badge">
            {pendingDoses.length === 0 ? 'All Completed!' : `${pendingDoses.length} Remaining`}
          </span>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p style={{ fontSize: '20px' }}>Loading your pills...</p>
          </div>
        ) : doses.length === 0 ? (
          <div className="elderly-all-done-card">
            <CheckCircle2 size={64} color="#10b981" />
            <h2>No Pills Scheduled Today</h2>
            <p>You have no medicine to take at this time. Relax and stay hydrated!</p>
          </div>
        ) : (
          <div className="elderly-dose-stack">
            {doses.map((dose) => (
              <DoseItemCard
                key={dose._id}
                dose={dose}
                onTake={handleTake}
                onSnooze={handleSnooze}
                onSkip={handleSkip}
                isElderlyView={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
