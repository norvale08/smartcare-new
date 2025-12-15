// FILE: app/caretaker/components/DoctorMedicationManagement.tsx
import React, { useState, useEffect } from 'react';
import { Stethoscope, RefreshCw, FileText as FileTextIcon } from 'lucide-react';

// Import components
import SideEffectUpdateModal from'./SideEffectUpdateModal';
import StatsCards from './StatsCards';
import FiltersSection from './FiltersSection';
import MedicationCard from'./MedicationCard';

interface PatientInfo {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

interface DoctorInfo {
  _id: string;
  fullName: string;
  specialization?: string;
}

interface SideEffect {
  sideEffectName: string;
  reportedAt: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  intensity?: 'mild' | 'moderate' | 'severe' | 'very severe';
  resolved?: boolean;
  doctorNotes?: string;
  resolvedAt?: string;
  doctorId?: string;
  lastUpdated?: string;
}

interface Medication {
  _id?: string;
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminders: string[];
  status: 'active' | 'completed' | 'missed' | 'stopped' | 'cancelled';
  startDate: string;
  patientId: string | PatientInfo;
  prescribedBy: string | DoctorInfo;
  createdAt: string;
  lastTaken?: string;
  adherence?: {
    currentStatus: 'taken' | 'missed' | 'stopped';
    reasonForStopping?: string;
    stoppedAt?: string;
    history?: Array<{
      date: string;
      status: string;
      reason?: string;
      notes?: string;
    }>;
  };
  patientAllergies?: Array<{
    allergyName: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction: string;
    notes?: string;
  }>;
  potentialSideEffects?: Array<{
    name: string;
    severity: 'common' | 'uncommon' | 'rare';
    description?: string;
  }>;
  experiencedSideEffects?: SideEffect[];
  summary?: {
    totalSideEffects: number;
    severeSideEffects: number;
    unresolvedSideEffects: number;
  };
}

interface DoctorMedicationManagementProps {
  patient?: {
    id: string;
    fullName: string;
  };
  onMedicationSelect?: (medication: Medication) => void;
}

interface SideEffectModalState {
  isOpen: boolean;
  sideEffect: null | (SideEffect & { medicationId: string; effectIndex: number; medicationName: string });
  patientName: string;
}

// Define report row type
type ReportRow = {
  Patient: string;
  Medication: string;
  'Side Effect': string;
  Severity: 'mild' | 'moderate' | 'severe';
  Intensity: string;
  'Patient Notes': string;
  'Doctor Notes': string;
  Resolved: string;
  'Reported Date': string;
  'Last Updated': string;
};

const DoctorMedicationManagement: React.FC<DoctorMedicationManagementProps> = ({ patient, onMedicationSelect }) => {
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
  
  const [stats, setStats] = useState({
    totalMedications: 0,
    active: 0,
    stopped: 0,
    completed: 0,
    totalSideEffects: 0,
    severeSideEffects: 0,
    unresolvedSideEffects: 0
  });

  // Helper function to get patient name
  const getPatientName = (patientId: string | PatientInfo): string => {
    if (typeof patientId === 'string') {
      if (patient && patient.id === patientId) {
        return patient.fullName;
      }
      return 'Unknown Patient';
    }
    return patientId.fullName || 'Unknown Patient';
  };

  // Helper function to get patient ID
  const getPatientId = (patientId: string | PatientInfo): string => {
    if (typeof patientId === 'string') {
      return patientId;
    }
    return patientId._id;
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Fetch medications on component mount and when patient changes
  useEffect(() => {
    fetchDoctorPrescriptions();
  }, [patient]);

  const fetchDoctorPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("❌ No authentication token found");
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
        return;
      }

      // Determine which endpoint to call
      let endpoint = '';
      let isPatientView = false;
      
      if (patient && patient.id) {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/doctor-view/${patient.id}`;
        isPatientView = true;
        console.log(`🔄 Fetching medications for patient: ${patient.fullName} (${patient.id})`);
      } else {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/side-effects/doctor-summary`;
        console.log(`🔄 Fetching medications for all patients`);
      }

      console.log(`📡 API Endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log(`📡 Response Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API Response Received:`, data);
        
        let transformedMedications: Medication[] = [];
        
        if (isPatientView) {
          if (data.success && data.data) {
            const medicationsData = data.data.medications || [];
            console.log(`📊 Found ${medicationsData.length} medications in response`);
            
            // Use Set to filter out duplicates based on medication ID and name
            const uniqueMedicationsMap = new Map();
            
            medicationsData.forEach((med: any, index: number) => {
              const medId = med._id || med.id || `med-${index}-${Date.now()}`;
              const medName = med.medicationName || 'Unknown Medication';
              
              // Create a unique key to identify duplicates
              const uniqueKey = `${medId}-${medName}`;
              
              // Only add if not already in map (prevents duplicates)
              if (!uniqueMedicationsMap.has(uniqueKey)) {
                // Extract patient information
                let patientId: string | PatientInfo;
                if (med.patientId && typeof med.patientId === 'object') {
                  patientId = {
                    _id: med.patientId._id || med.patientId.id || patient?.id || 'unknown',
                    fullName: med.patientId.fullName || patient?.fullName || 'Unknown Patient',
                    email: med.patientId.email,
                    phoneNumber: med.patientId.phoneNumber
                  };
                } else {
                  patientId = patient?.id || 'unknown';
                }

                // Extract doctor information
                let prescribedBy: string | DoctorInfo;
                if (med.prescribedBy && typeof med.prescribedBy === 'object') {
                  prescribedBy = {
                    _id: med.prescribedBy._id || med.prescribedBy.id || 'unknown',
                    fullName: med.prescribedBy.fullName || 'Unknown Doctor',
                    specialization: med.prescribedBy.specialization
                  };
                } else if (typeof med.prescribedBy === 'string') {
                  prescribedBy = med.prescribedBy;
                } else {
                  prescribedBy = 'unknown';
                }

                // Extract side effects
                const experiencedSideEffects: SideEffect[] = (med.experiencedSideEffects || []).map((effect: any) => ({
                  sideEffectName: effect.sideEffectName || 'Unknown Effect',
                  reportedAt: effect.reportedAt || new Date().toISOString(),
                  severity: effect.severity || 'mild',
                  notes: effect.notes,
                  intensity: effect.intensity,
                  resolved: effect.resolved || false,
                  doctorNotes: effect.doctorNotes,
                  resolvedAt: effect.resolvedAt,
                  doctorId: effect.doctorId,
                  lastUpdated: effect.lastUpdated
                }));

                // Calculate summary
                const totalSideEffects = experiencedSideEffects.length;
                const severeSideEffects = experiencedSideEffects.filter(e => 
                  e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
                ).length;
                const unresolvedSideEffects = experiencedSideEffects.filter(e => !e.resolved).length;

                uniqueMedicationsMap.set(uniqueKey, {
                  id: medId,
                  _id: med._id || med.id,
                  medicationName: medName,
                  dosage: med.dosage || 'Not specified',
                  frequency: med.frequency || 'Not specified',
                  duration: med.duration || 'Not specified',
                  instructions: med.instructions || '',
                  reminders: med.reminders || [],
                  status: med.status || 'active',
                  startDate: med.startDate || med.createdAt || new Date().toISOString(),
                  patientId,
                  prescribedBy,
                  createdAt: med.createdAt || new Date().toISOString(),
                  lastTaken: med.lastTaken,
                  adherence: med.adherence || {
                    currentStatus: 'taken',
                    history: []
                  },
                  patientAllergies: med.patientAllergies || [],
                  potentialSideEffects: med.potentialSideEffects || [],
                  experiencedSideEffects,
                  summary: {
                    totalSideEffects,
                    severeSideEffects,
                    unresolvedSideEffects
                  }
                });
              } else {
                console.log(`⚠️ Duplicate medication skipped: ${medName} (${medId})`);
              }
            });
            
            transformedMedications = Array.from(uniqueMedicationsMap.values());
            console.log(`🏁 Successfully transformed ${transformedMedications.length} unique medications (removed ${medicationsData.length - transformedMedications.length} duplicates)`);
          } else {
            console.warn(`⚠️ No medication data found for patient:`, data);
          }
        } else {
          // Handle summary view for all patients
          if (data.success && data.data) {
            const allSideEffects = data.data.recentSideEffects || [];
            console.log(`📊 Found ${allSideEffects.length} side effects in summary`);
            
            // Use Map to filter out duplicates based on medication ID and patient ID
            const medicationsMap = new Map();
            
            allSideEffects.forEach((se: any) => {
              const key = `${se.patientId}_${se.medicationId}`;
              if (!medicationsMap.has(key)) {
                medicationsMap.set(key, {
                  id: se.medicationId,
                  medicationName: se.medicationName,
                  patientId: {
                    _id: se.patientId,
                    fullName: se.patient?.fullName || 'Unknown Patient',
                    email: se.patient?.email
                  },
                  status: se.status || 'active',
                  experiencedSideEffects: []
                });
              }
              // Add side effect to existing medication
              const medication = medicationsMap.get(key);
              medication.experiencedSideEffects.push({
                sideEffectName: se.sideEffectName,
                reportedAt: se.reportedAt,
                severity: se.severity,
                notes: se.notes,
                intensity: se.intensity,
                resolved: se.resolved,
                doctorNotes: se.doctorNotes,
                resolvedAt: se.resolvedAt,
                doctorId: se.doctorId,
                lastUpdated: se.lastUpdated
              });
            });
            
            transformedMedications = Array.from(medicationsMap.values()).map((med: any) => ({
              id: med.id,
              medicationName: med.medicationName,
              patientId: med.patientId,
              status: med.status,
              experiencedSideEffects: med.experiencedSideEffects,
              dosage: 'Not specified',
              frequency: 'Not specified',
              duration: 'Not specified',
              instructions: '',
              reminders: [],
              startDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              prescribedBy: 'unknown',
              adherence: { currentStatus: 'taken', history: [] },
              patientAllergies: [],
              potentialSideEffects: [],
              summary: {
                totalSideEffects: med.experiencedSideEffects.length,
                severeSideEffects: med.experiencedSideEffects.filter((e: any) => 
                  e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
                ).length,
                unresolvedSideEffects: med.experiencedSideEffects.filter((e: any) => !e.resolved).length
              }
            }));
          }
        }

        // Update state with transformed medications
        setMedications(transformedMedications);
        
        // Calculate and update statistics
        const calculatedStats = {
          totalMedications: transformedMedications.length,
          active: transformedMedications.filter(m => m.status === 'active').length,
          stopped: transformedMedications.filter(m => m.status === 'stopped').length,
          completed: transformedMedications.filter(m => m.status === 'completed').length,
          totalSideEffects: transformedMedications.reduce((sum, m) => sum + (m.experiencedSideEffects?.length || 0), 0),
          severeSideEffects: transformedMedications.reduce((sum, m) => sum + 
            (m.experiencedSideEffects?.filter((e: any) => 
              e.severity === 'severe' || e.intensity === 'severe' || e.intensity === 'very severe'
            ).length || 0), 0),
          unresolvedSideEffects: transformedMedications.reduce((sum, m) => 
            sum + (m.experiencedSideEffects?.filter((e: any) => !e.resolved).length || 0), 0)
        };
        
        console.log(`📈 Updated Statistics:`, calculatedStats);
        setStats(calculatedStats);
        
      } else {
        console.error(`❌ API Error: ${response.status}`);
        const errorText = await response.text();
        console.error(`❌ Error Details:`, errorText);
        
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
      }
    } catch (error) {
      console.error('❌ Network/Server Error:', error);
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

  // FIXED DELETE ROUTE - Changed to correct endpoint
  // FIXED DELETE FUNCTION - Use the correct endpoint from medicine.ts
// In DoctorMedicationManagement.tsx, update the deleteMedication function:
const deleteMedication = async (medicationId: string) => {
  if (!confirm('Are you sure you want to delete this medication prescription? This action cannot be undone.')) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert('Authentication required');
      return;
    }

    console.log("🗑️ Deleting medication:", medicationId);
    console.log("📊 User Role:", "doctor");

    // IMPORTANT: Use the patient's medication reminders endpoint instead
    // This will delete from both doctor and patient views
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}`;
    console.log("🌐 Using DELETE endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📡 Response Status:", response.status);
    
    if (response.ok) {
      console.log("✅ Medication deleted successfully");
      // Remove from local state
      setMedications(prev => prev.filter(med => med.id !== medicationId));
      alert('Medication prescription deleted successfully');
      fetchDoctorPrescriptions(); // Refresh data
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to delete medication:', errorData);
      
      // Check if it's a permission error
      if (response.status === 403) {
        alert('You can only delete medications you prescribed');
      } else if (response.status === 404) {
        alert('Medication not found');
      } else {
        alert(`Failed to delete medication: ${errorData?.message || 'Unknown error'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error deleting medication:', error);
    alert('Network error deleting medication. Please check your connection.');
  }
};

  const updateMedicationStatus = async (medicationId: string, newStatus: 'active' | 'completed' | 'stopped' | 'cancelled') => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert('Authentication required');
      return;
    }

    console.log("📝 Updating medication status:", medicationId, newStatus);

    // CORRECT ENDPOINT: Use /api/medications/:id (from medicine.ts)
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/${medicationId}`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        status: newStatus,
        // Include other fields that might be required
        lastUpdated: new Date().toISOString()
      }),
    });

    console.log("📡 Response Status:", response.status);
    
    if (response.ok) {
      console.log("✅ Medication status updated successfully");
      // Update local state
      setMedications(prev =>
        prev.map(med =>
          med.id === medicationId ? { ...med, status: newStatus } : med
        )
      );
      alert('Medication status updated successfully');
      fetchDoctorPrescriptions(); // Refresh data
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to update medication status:', errorData);
      
      if (response.status === 403) {
        alert('You can only update medications you prescribed');
      } else if (response.status === 404) {
        alert('Medication not found');
      } else {
        alert(`Failed to update medication status: ${errorData?.message || 'Unknown error'}`);
      }
    }

  } catch (error) {
    console.error('Error updating medication status:', error);
    alert('Network error updating medication status. Please check your connection.');
  }
};

  const updateSideEffectStatus = async (medicationId: string, effectIndex: number, updates: { resolved: boolean; doctorNotes: string }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert('Authentication required');
        return false;
      }
      
      console.log(`🔄 Updating side effect for medication ${medicationId}, index ${effectIndex}`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/side-effects/${effectIndex}/doctor-update`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates)
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Side effect updated successfully:', result);
        
        // Update local state
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
        
        // Refresh to get updated stats
        fetchDoctorPrescriptions();
        
        alert('Side effect updated successfully');
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Failed to update side effect:', error);
        alert(`Failed to update side effect: ${error.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating side effect:', error);
      alert('Error updating side effect. Please try again.');
      return false;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDoctorPrescriptions();
  };

  const toggleMedicationExpand = (medicationId: string) => {
    setExpandedMedications(prev => ({
      ...prev,
      [medicationId]: !prev[medicationId]
    }));
  };

  const openSideEffectModal = (sideEffect: SideEffect, medicationId: string, effectIndex: number, medicationName: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      console.error('Medication not found:', medicationId);
      return;
    }
    
    const patientName = getPatientName(medication.patientId);
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

  const exportSideEffectsReport = () => {
    const reportData: ReportRow[] = medications.flatMap(med => 
      (med.experiencedSideEffects || []).map(se => ({
        Patient: getPatientName(med.patientId),
        Medication: med.medicationName,
        'Side Effect': se.sideEffectName,
        Severity: se.severity,
        Intensity: se.intensity || 'N/A',
        'Patient Notes': se.notes || 'N/A',
        'Doctor Notes': se.doctorNotes || 'N/A',
        Resolved: se.resolved ? 'Yes' : 'No',
        'Reported Date': formatDate(se.reportedAt),
        'Last Updated': se.lastUpdated ? formatDate(se.lastUpdated) : 'N/A'
      }))
    );

    if (reportData.length === 0) {
      alert('No side effects data to export');
      return;
    }

    // Get headers from the type definition
    const headers: (keyof ReportRow)[] = [
      'Patient',
      'Medication',
      'Side Effect',
      'Severity',
      'Intensity',
      'Patient Notes',
      'Doctor Notes',
      'Resolved',
      'Reported Date',
      'Last Updated'
    ];

    const csvRows = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(header => {
          const value = row[header];
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `side-effects-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter medications based on search term, status, and severity
  const filteredMedications = medications.filter(medication => {
    // Convert search term to lowercase for case-insensitive comparison
    const searchLower = searchTerm.toLowerCase();
    
    // Check search term
    const matchesSearch = searchTerm === '' || 
      medication.medicationName.toLowerCase().includes(searchLower) ||
      getPatientName(medication.patientId).toLowerCase().includes(searchLower);
    
    // Check status filter
    const matchesStatus = filterStatus === 'all' || medication.status === filterStatus;
    
    // Check severity filter
    const matchesSeverity = filterSeverity === 'all' || 
      (medication.experiencedSideEffects && 
       medication.experiencedSideEffects.some(se => {
         return se.severity === filterSeverity || 
                (se.intensity && se.intensity === filterSeverity);
       }));
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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

      {/* Main Content */}
      <div className="bg-white rounded-lg border shadow-sm">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Stethoscope className="w-6 h-6 text-blue-600" />
                <span>Medication Management</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {patient ? `Managing medications for ${patient.fullName}` : 'Overview of all patient medications'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportSideEffectsReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                title="Export side effects report"
              >
                <FileTextIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 border"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

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
          hasActiveFilters={!!(searchTerm || filterStatus !== 'all' || filterSeverity !== 'all')}
        />

        {/* Medications Grid */}
        <div className="p-6">
          {filteredMedications.length === 0 && medications.length > 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 text-gray-300 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">No Matching Medications</h4>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {medications.length} medications found but none match your current filters.
                Try adjusting your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterSeverity('all');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            </div>
          ) : filteredMedications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 text-gray-300 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">No Medications Found</h4>
              <p className="text-gray-500 mb-6">
                {patient 
                  ? `No medications have been prescribed for ${patient.fullName} yet.`
                  : 'No patient medications found in the system.'
                }
              </p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMedications.map(medication => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  patient={patient}
                  isExpanded={expandedMedications[medication.id] || false}
                  onToggleExpand={() => toggleMedicationExpand(medication.id)}
                  onUpdateStatus={updateMedicationStatus}
                  onDelete={deleteMedication}
                  onOpenSideEffectModal={openSideEffectModal}
                  getPatientName={getPatientName}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorMedicationManagement;
