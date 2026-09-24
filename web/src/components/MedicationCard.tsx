import React, { useState } from 'react';
import { Medication } from '../types/medication';
import { Pill, Clock, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';

interface MedicationCardProps {
  medication: Medication;
  onRefill: (medicationId: string, amount: number) => Promise<void>;
  onArchive: (medicationId: string) => Promise<void>;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onRefill,
  onArchive
}) => {
  const [isRefilling, setIsRefilling] = useState(false);
  const [refillAmount, setRefillAmount] = useState('30');
  const isLowStock = medication.currentStock <= medication.refillThreshold;

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(refillAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    await onRefill(medication._id, amount);
    setIsRefilling(false);
  };

  return (
    <div className={`medication-card ${isLowStock ? 'card-low-stock' : ''}`}>
      <div className="card-header">
        <div className="med-icon" style={{ backgroundColor: medication.colorCode || '#3b82f6' }}>
          <Pill size={22} color="#ffffff" />
        </div>
        <div className="med-title-group">
          <h3 className="med-name">{medication.name}</h3>
          {medication.genericName && (
            <span className="med-generic">({medication.genericName})</span>
          )}
        </div>
        <button
          className="btn-icon-danger"
          onClick={() => {
            if (window.confirm(`Archive ${medication.name}? This will disable upcoming doses.`)) {
              onArchive(medication._id);
            }
          }}
          title="Archive Medication"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="card-body">
        <div className="med-detail-badge">
          <span>{medication.dosage} {medication.dosageUnit}</span>
          <span className="bullet-dot">•</span>
          <span>{medication.pillsPerDose} per dose</span>
        </div>

        {medication.instructions && (
          <p className="med-instructions">"{medication.instructions}"</p>
        )}

        {medication.schedule && (
          <div className="schedule-pills">
            <Clock size={14} className="icon-schedule" />
            <div className="times-list">
              {medication.schedule.scheduledTimes.map((t, idx) => (
                <span key={idx} className="time-tag">{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="stock-container">
          <div className="stock-info">
            <span className="stock-label">Inventory:</span>
            <span className={`stock-count ${isLowStock ? 'stock-warning' : ''}`}>
              {medication.currentStock} {medication.dosageUnit}s
            </span>
          </div>

          {isLowStock && (
            <div className="low-stock-alert">
              <AlertTriangle size={14} />
              <span>Low stock (below {medication.refillThreshold})</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        {isRefilling ? (
          <form onSubmit={handleRefillSubmit} className="refill-form">
            <input
              type="number"
              min="1"
              max="500"
              value={refillAmount}
              onChange={(e) => setRefillAmount(e.target.value)}
              className="input-refill"
              autoFocus
            />
            <button type="submit" className="btn-confirm-refill">Add</button>
            <button type="button" onClick={() => setIsRefilling(false)} className="btn-cancel-refill">Cancel</button>
          </form>
        ) : (
          <button onClick={() => setIsRefilling(true)} className="btn-refill">
            <PlusCircle size={16} />
            <span>Refill Stock</span>
          </button>
        )}
      </div>
    </div>
  );
};
