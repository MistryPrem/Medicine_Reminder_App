import React, { useState } from 'react';
import { DoseItem } from '../types/medication';
import { CheckCircle2, Clock, AlertCircle, FastForward, XCircle } from 'lucide-react';

interface DoseItemCardProps {
  dose: DoseItem;
  onTake: (doseId: string) => Promise<void>;
  onSnooze: (doseId: string, minutes: number) => Promise<void>;
  onSkip: (doseId: string, reason?: string) => Promise<void>;
  isElderlyView?: boolean;
}

export const DoseItemCard: React.FC<DoseItemCardProps> = ({
  dose,
  onTake,
  onSnooze,
  onSkip,
  isElderlyView = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const scheduledTime = new Date(dose.scheduledFor).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleAction = async (actionFn: () => Promise<void>) => {
    try {
      setIsProcessing(true);
      await actionFn();
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (dose.status) {
      case 'taken':
        return <span className="status-pill status-taken"><CheckCircle2 size={16} /> Taken</span>;
      case 'snoozed':
        return <span className="status-pill status-snoozed"><Clock size={16} /> Snoozed</span>;
      case 'missed':
        return <span className="status-pill status-missed"><AlertCircle size={16} /> Missed</span>;
      case 'skipped':
        return <span className="status-pill status-skipped"><XCircle size={16} /> Skipped</span>;
      default:
        return <span className="status-pill status-scheduled"><Clock size={16} /> Due {scheduledTime}</span>;
    }
  };

  const isTerminal = dose.status === 'taken' || dose.status === 'skipped';

  return (
    <div className={`dose-item-card status-border-${dose.status} ${isElderlyView ? 'elderly-scale' : ''}`}>
      <div className="dose-header">
        <div className="dose-time-badge">
          <Clock size={isElderlyView ? 24 : 18} />
          <span className="time-text">{scheduledTime}</span>
        </div>
        {getStatusBadge()}
      </div>

      <div className="dose-main">
        <h4 className="dose-med-name">{dose.medicationId.name}</h4>
        <p className="dose-dosage-text">
          {dose.medicationId.dosage} {dose.medicationId.dosageUnit}
          {dose.medicationId.pillsPerDose > 1 ? ` (${dose.medicationId.pillsPerDose} pills)` : ''}
        </p>

        {dose.medicationId.instructions && (
          <p className="dose-instructions">"{dose.medicationId.instructions}"</p>
        )}
      </div>

      {!isTerminal && (
        <div className="dose-actions-group">
          <button
            onClick={() => handleAction(() => onTake(dose._id))}
            disabled={isProcessing}
            className="btn-action-take"
            title="Confirm Dose Taken"
          >
            <CheckCircle2 size={isElderlyView ? 28 : 20} />
            <span>TAKEN</span>
          </button>

          <button
            onClick={() => handleAction(() => onSnooze(dose._id, 15))}
            disabled={isProcessing}
            className="btn-action-snooze"
            title="Snooze for 15 minutes"
          >
            <FastForward size={isElderlyView ? 24 : 18} />
            <span>SNOOZE 15m</span>
          </button>

          <button
            onClick={() => setShowSkipModal(true)}
            disabled={isProcessing}
            className="btn-action-skip"
            title="Skip this dose"
          >
            <XCircle size={isElderlyView ? 24 : 18} />
            <span>SKIP</span>
          </button>
        </div>
      )}

      {showSkipModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Skip Dose: {dose.medicationId.name}</h3>
            <p>Please provide an optional reason for your caregiver:</p>
            <textarea
              className="skip-textarea"
              placeholder="e.g. Felt nauseous, doctor advised skipping..."
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowSkipModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-skip"
                disabled={isProcessing}
                onClick={() =>
                  handleAction(async () => {
                    await onSkip(dose._id, skipReason);
                    setShowSkipModal(false);
                  })
                }
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
