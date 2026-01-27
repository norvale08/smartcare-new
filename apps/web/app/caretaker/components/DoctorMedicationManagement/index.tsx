// FILE: app/caretaker/components/DoctorMedicationManagement/index.tsx

import React from 'react';

// Import components
import SideEffectUpdateModal from '../SideEffectUpdateModal';
import StatsCards from '../StatsCards';
import FiltersSection from '../FiltersSection';
import MedicationPrescriptionModal from '../MedicationPrescriptionModal';
import Header from './components/Header';
import LoadingState from './components/LoadingStte';
import EmptyState from './components/Emptystate';
import NoMatchingResults from './components/Nomatchingresult';
import MedicationList from './components/MedicationList';

// Import types
import { DoctorMedicationManagementProps } from '../types/medication-types';

// Import hooks and utilities
import { useMedicationManagement } from './hooks/useMedicationManagement';
import { filterMedications, hasActiveFilters } from './utils/filter-utils';
import { exportSideEffectsReport } from './utils/export-utils';
import { getPatientName, getPatientId, formatDate } from './utils/medication-utils';

const DoctorMedicationManagement: React.FC<DoctorMedicationManagementProps> = ({ 
  patient, 
  onMedicationSelect 
}) => {
  const {
    // State
    medications,
    loading,
    searchTerm,
    filterStatus,
    filterSeverity,
    refreshing,
    expandedMedications,
    sideEffectModal,
    prescriptionModalOpen,
    editingMedication,
    stats,
    
    // Setters
    setSearchTerm,
    setFilterStatus,
    setFilterSeverity,
    
    // Actions
    deleteMedication,
    updateMedicationStatus,
    updateSideEffectStatus,
    handleRefresh,
    toggleMedicationExpand,
    openSideEffectModal,
    closeSideEffectModal,
    handleEditMedication,
    handlePrescriptionSuccess,
    openPrescriptionModal,
    closePrescriptionModal,
  } = useMedicationManagement({ patient });

  // Filter medications based on search and filters
  const filteredMedications = filterMedications(
    medications,
    searchTerm,
    filterStatus,
    filterSeverity,
    patient
  );

  // Check if filters are active
  const filtersActive = hasActiveFilters(searchTerm, filterStatus, filterSeverity);

  // Clear all filters handler
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterSeverity('all');
  };

  // Export report handler
  const handleExportReport = () => {
    exportSideEffectsReport(medications, patient);
  };

  // Get patient name helper
  const getPatientNameHelper = (patientId: string | any) => {
    return getPatientName(patientId, patient);
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Side Effect Update Modal */}
      <SideEffectUpdateModal
        isOpen={sideEffectModal.isOpen}
        onClose={closeSideEffectModal}
        sideEffect={sideEffectModal.sideEffect}
        patientName={sideEffectModal.patientName}
        onUpdate={async (updates) => {
          if (sideEffectModal.sideEffect) {
            await updateSideEffectStatus(
              sideEffectModal.sideEffect.medicationId,
              sideEffectModal.sideEffect.effectIndex,
              updates
            );
          }
        }}
      />

      {/* Medication Prescription Modal */}
      <MedicationPrescriptionModal
        isOpen={prescriptionModalOpen}
        onClose={closePrescriptionModal}
        patient={patient ? {
          id: patient.id,
          name: patient.fullName
        } : undefined}
        onPrescribe={handlePrescriptionSuccess}
        editingMedication={editingMedication ? {
          ...editingMedication,
          status: editingMedication.status === 'missed' 
            ? 'stopped' 
            : (editingMedication.status || 'active') as 'active' | 'completed' | 'stopped' | 'cancelled' | 'inactive'
        } : null}
      />

      {/* Main Content */}
      <div className="bg-white rounded-lg border shadow-sm">
        {/* Header */}
        <Header
          patient={patient}
          onExportReport={handleExportReport}
          onRefresh={handleRefresh}
          onPrescribeMedication={openPrescriptionModal}
          refreshing={refreshing}
        />

        {/* Stats Cards */}
        <StatsCards 
          stats={stats} 
          patientCount={[...new Set(medications.map(m => getPatientId(m.patientId)))].length}
        />

        {/* Filters and Search */}
        <FiltersSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterSeverity={filterSeverity}
          setFilterSeverity={setFilterSeverity}
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          filteredCount={filteredMedications.length}
          totalCount={medications.length}
          patient={patient}
          hasActiveFilters={filtersActive}
        />

        {/* Medications Grid */}
        <div className="p-6">
          {filteredMedications.length === 0 && medications.length > 0 ? (
            <NoMatchingResults
              totalCount={medications.length}
              onClearFilters={handleClearFilters}
            />
          ) : filteredMedications.length === 0 ? (
            <EmptyState
              patient={patient}
              onRefresh={handleRefresh}
              onPrescribeMedication={openPrescriptionModal}
            />
          ) : (
            <MedicationList
              medications={filteredMedications}
              patient={patient}
              expandedMedications={expandedMedications}
              onToggleExpand={toggleMedicationExpand}
              onEdit={handleEditMedication}
              onUpdateStatus={updateMedicationStatus}
              onDelete={deleteMedication}
              onOpenSideEffectModal={openSideEffectModal}
              getPatientName={getPatientNameHelper}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorMedicationManagement;