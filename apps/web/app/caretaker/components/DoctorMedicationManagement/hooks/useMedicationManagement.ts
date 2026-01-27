// FILE: app/caretaker/components/DoctorMedicationManagement/hooks/useMedicationManagement.ts

import { useState, useEffect } from 'react';
import { Medication,MedicationForForm, 
  SideEffect, 
  SideEffectModalState,
  MedicationStats } from '../../types/medication-types';
  
import { 
  fetchDoctorPrescriptions, 
  deleteMedicationAPI, 
  updateMedicationStatusAPI, 
  updateSideEffectStatusAPI 
} from '../api/medication-api';
import { transformPatientViewMedications,transformSummaryViewMedications, 
  calculateMedicationStats } from '../utils/data-trasformers'; 
  
import { getPatientName, convertForForm } from '../utils/medication-utils';

interface UseMedicationManagementProps {
  patient?: {
    id: string;
    fullName: string;
  };
}

export const useMedicationManagement = ({ patient }: UseMedicationManagementProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'stopped' | 'completed'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMedications, setExpandedMedications] = useState<{ [key: string]: boolean }>({});
  const [sideEffectModal, setSideEffectModal] = useState<SideEffectModalState>({
    isOpen: false,
    sideEffect: null,
    patientName: ''
  });
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationForForm | null>(null);
  const [stats, setStats] = useState<MedicationStats>({
    totalMedications: 0,
    active: 0,
    stopped: 0,
    completed: 0,
    totalSideEffects: 0,
    severeSideEffects: 0,
    unresolvedSideEffects: 0
  });

  // Fetch medications on component mount and when patient changes
  useEffect(() => {
    fetchMedications();
  }, [patient]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      
      const { data, isPatientView } = await fetchDoctorPrescriptions(patient?.id);
      console.log(`✅ API Response Received:`, data);
      
      let transformedMedications: Medication[] = [];
      
      if (isPatientView) {
        if (data.success && data.data) {
          const medicationsData = data.data.medications || [];
          console.log(`📊 Found ${medicationsData.length} medications in response`);
          transformedMedications = transformPatientViewMedications(medicationsData, patient);
          console.log(`🏁 Successfully transformed ${transformedMedications.length} unique medications`);
        } else {
          console.warn(`⚠️ No medication data found for patient:`, data);
        }
      } else {
        if (data.success && data.data) {
          const allSideEffects = data.data.recentSideEffects || [];
          console.log(`📊 Found ${allSideEffects.length} side effects in summary`);
          transformedMedications = transformSummaryViewMedications(allSideEffects);
        }
      }

      setMedications(transformedMedications);
      const calculatedStats = calculateMedicationStats(transformedMedications);
      console.log(`📈 Updated Statistics:`, calculatedStats);
      setStats(calculatedStats);
      
    } catch (error) {
      console.error('❌ Error fetching medications:', error);
      setMedications([]);
      setStats({
        totalMedications: 0,
        active: 0,
        stopped: 0,
        completed: 0,
        totalSideEffects: 0,
        severeSideEffects: 0,
        unresolvedSideEffects: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('🏁 Data fetching completed');
    }
  };

  const deleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication prescription? This action cannot be undone.')) {
      return;
    }

    try {
      console.log("🗑️ Deleting medication:", medicationId);
      await deleteMedicationAPI(medicationId);
      console.log("✅ Medication deleted successfully");
      setMedications(prev => prev.filter(med => med.id !== medicationId));
      alert('Medication prescription deleted successfully');
      fetchMedications();
    } catch (error: any) {
      console.error('❌ Error deleting medication:', error);
      alert(error.message || 'Error deleting medication. Please try again.');
    }
  };

  const updateMedicationStatus = async (
    medicationId: string, 
    newStatus: 'active' | 'completed' | 'stopped' | 'cancelled'
  ) => {
    try {
      console.log("📝 Updating medication status:", medicationId, newStatus);
      await updateMedicationStatusAPI(medicationId, newStatus);
      console.log("✅ Medication status updated successfully");
      setMedications(prev =>
        prev.map(med =>
          med.id === medicationId ? { ...med, status: newStatus } : med
        )
      );
      alert('Medication status updated successfully');
      fetchMedications();
    } catch (error: any) {
      console.error('Error updating medication status:', error);
      alert(error.message || 'Error updating medication status. Please try again.');
    }
  };

  const updateSideEffectStatus = async (
    medicationId: string, 
    effectIndex: number, 
    updates: { resolved: boolean; doctorNotes: string }
  ) => {
    try {
      console.log(`🔄 Updating side effect for medication ${medicationId}, index ${effectIndex}`);
      await updateSideEffectStatusAPI(medicationId, effectIndex, updates);
      console.log('✅ Side effect updated successfully');
      
      setMedications(prev => prev.map(med => {
        if (med.id === medicationId && med.experiencedSideEffects) {
          const updatedEffects = [...med.experiencedSideEffects];
          if (updatedEffects[effectIndex]) {
            updatedEffects[effectIndex] = {
              ...updatedEffects[effectIndex],
              resolved: updates.resolved,
              doctorNotes: updates.doctorNotes,
              resolvedAt: updates.resolved ? new Date().toISOString() : undefined,
              lastUpdated: new Date().toISOString()
            };
          }
          return { ...med, experiencedSideEffects: updatedEffects };
        }
        return med;
      }));
      
      fetchMedications();
      alert('Side effect updated successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error updating side effect:', error);
      alert(error.message || 'Error updating side effect. Please try again.');
      return false;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMedications();
  };

  const toggleMedicationExpand = (medicationId: string) => {
    setExpandedMedications(prev => ({
      ...prev,
      [medicationId]: !prev[medicationId]
    }));
  };

  const openSideEffectModal = (
    sideEffect: SideEffect, 
    medicationId: string, 
    effectIndex: number, 
    medicationName: string
  ) => {
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      console.error('Medication not found:', medicationId);
      return;
    }
    
    const patientName = getPatientName(medication.patientId, patient);
    setSideEffectModal({
      isOpen: true,
      sideEffect: { ...sideEffect, medicationId, effectIndex, medicationName },
      patientName
    });
  };

  const closeSideEffectModal = () => {
    setSideEffectModal({
      isOpen: false,
      sideEffect: null,
      patientName: ''
    });
  };

  const handleEditMedication = (medication: Medication) => {
    console.log('Editing medication:', medication);
    const convertedMedication = convertForForm(medication);
    setEditingMedication(convertedMedication);
    setPrescriptionModalOpen(true);
  };

  const handlePrescriptionSuccess = () => {
    fetchMedications();
    setEditingMedication(null);
  };

  const openPrescriptionModal = () => {
    setEditingMedication(null);
    setPrescriptionModalOpen(true);
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
    setEditingMedication(null);
  };

  return {
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
  };
};