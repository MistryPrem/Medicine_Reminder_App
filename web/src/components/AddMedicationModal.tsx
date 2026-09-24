import React, { useState } from 'react';
import { CreateMedicationPayload, DosageUnit, FrequencyType } from '../types/medication';
import { X, Plus, Trash2 } from 'lucide-react';

interface AddMedicationModalProps {
  elderlyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMedicationPayload) => Promise<void>;
}

const DOSAGE_UNITS: DosageUnit[] = [
  'tablet',
  'capsule',
  'mg',
  'ml',
  'drops',
  'puff',
  'patch',
  'units',
  'sachet'
];

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  elderlyId,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('1');
  const [dosageUnit, setDosageUnit] = useState<DosageUnit>('tablet');
  const [instructions, setInstructions] = useState('');
  const [currentStock, setCurrentStock] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(7);
  const [pillsPerDose, setPillsPerDose] = useState(1);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('once_daily');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTime = () => {
    setScheduledTimes([...scheduledTimes, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    if (scheduledTimes.length > 1) {
      setScheduledTimes(scheduledTimes.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const updated = [...scheduledTimes];
    updated[index] = value;
    setScheduledTimes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Medication name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        elderlyId,
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        dosage: dosage.trim(),
        dosageUnit,
        instructions: instructions.trim() || undefined,
        currentStock: Number(currentStock),
        refillThreshold: Number(refillThreshold),
        pillsPerDose: Number(pillsPerDose),
        schedule: {
          frequencyType,
          scheduledTimes
        }
      });
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save medication';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-large">
        <div className="modal-header">
          <h2>Add New Medication & Schedule</h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="med-form">
          <div className="form-row">
            <div className="form-group">
              <label>Medication Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Metformin, Lisinopril"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Generic / Brand Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Glucophage"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dosage Amount *</label>
              <input
                type="text"
                required
                placeholder="e.g. 500, 10, 1"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Dosage Unit *</label>
              <select
                value={dosageUnit}
                onChange={(e) => setDosageUnit(e.target.value as DosageUnit)}
              >
                {DOSAGE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Pills Per Dose</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={pillsPerDose}
                onChange={(e) => setPillsPerDose(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Instructions (e.g. With breakfast, Before sleep)</label>
            <input
              type="text"
              placeholder="e.g. Take with a full glass of water after food"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current Stock (Pills)</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Refill Alert Threshold</label>
              <input
                type="number"
                min="0"
                value={refillThreshold}
                onChange={(e) => setRefillThreshold(Number(e.target.value))}
              />
            </div>
          </div>

          <hr className="form-divider" />
          <h3>Schedule Configuration</h3>

          <div className="form-group">
            <label>Frequency</label>
            <select
              value={frequencyType}
              onChange={(e) => {
                const val = e.target.value as FrequencyType;
                setFrequencyType(val);
                if (val === 'once_daily') setScheduledTimes(['08:00']);
                if (val === 'multiple_daily') setScheduledTimes(['08:00', '20:00']);
              }}
            >
              <option value="once_daily">Once Daily</option>
              <option value="multiple_daily">Multiple Times Daily</option>
              <option value="specific_days">Specific Days of the Week</option>
            </select>
          </div>

          <div className="form-group">
            <label>Scheduled Dosing Times (24-Hour)</label>
            <div className="times-picker-group">
              {scheduledTimes.map((time, idx) => (
                <div key={idx} className="time-input-row">
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                  />
                  {scheduledTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="btn-icon-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={handleAddTime} className="btn-add-time">
                <Plus size={16} /> Add Another Dose Time
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Medication & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
