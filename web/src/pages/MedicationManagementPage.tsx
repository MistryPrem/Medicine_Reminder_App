import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { MedicationCard } from '../components/MedicationCard';
import { AddMedicationModal } from '../components/AddMedicationModal';
import { Medication, CreateMedicationPayload } from '../types/medication';
import { LinkedElderly } from '../types/relationship';
import * as medicationService from '../services/medicationService';
import * as relationshipService from '../services/relationshipService';
import { Pill, Plus, Users, Search } from 'lucide-react';

export const MedicationManagementPage: React.FC = () => {
  const [elderlyList, setElderlyList] = useState<LinkedElderly[]>([]);
  const [selectedElderlyId, setSelectedElderlyId] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const loadMedications = useCallback(async () => {
    if (!selectedElderlyId) return;
    try {
      const meds = await medicationService.getMedicationsApi(selectedElderlyId);
      setMedications(meds);
    } catch {
      setMedications([]);
    }
  }, [selectedElderlyId]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const handleRefill = async (medicationId: string, amount: number) => {
    await medicationService.refillMedicationApi(medicationId, amount);
    await loadMedications();
  };

  const handleArchive = async (medicationId: string) => {
    await medicationService.archiveMedicationApi(medicationId);
    await loadMedications();
  };

  const handleCreateMedication = async (payload: CreateMedicationPayload) => {
    await medicationService.createMedicationApi(payload);
    await loadMedications();
  };

  const filteredMeds = medications.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        <div className="dashboard-header">
          <div>
            <h1>Prescription & Medication Catalog</h1>
            <p className="subtitle">Manage dosages, schedules, and pill inventory</p>
          </div>

          <div className="header-actions">
            {selectedElderlyId && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                <Plus size={18} />
                <span>Add Medication</span>
              </button>
            )}
          </div>
        </div>

        {/* Senior Selector */}
        {elderlyList.length > 0 && (
          <div className="senior-selector-bar">
            <span className="selector-label">Senior Profile:</span>
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

        {/* Search bar */}
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search medications by brand or generic name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading medications...</p>
          </div>
        ) : filteredMeds.length === 0 ? (
          <div className="empty-card">
            <Pill size={48} className="icon-empty" />
            <h2>No Medications Configured</h2>
            <p>Add prescription and dosage details to begin generating automated reminders.</p>
            {selectedElderlyId && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary btn-large">
                <Plus size={20} />
                <span>Add First Medication</span>
              </button>
            )}
          </div>
        ) : (
          <div className="medications-grid">
            {filteredMeds.map((med) => (
              <MedicationCard
                key={med._id}
                medication={med}
                onRefill={handleRefill}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </main>

      {selectedElderlyId && (
        <AddMedicationModal
          elderlyId={selectedElderlyId}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateMedication}
        />
      )}
    </div>
  );
};
