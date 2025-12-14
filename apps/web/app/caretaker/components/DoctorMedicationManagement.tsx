// FILE: app/caretaker/components/DoctorMedicationManagement.tsx
import React, { useState, useEffect } from 'react';
import { 
  Pill, Trash2, Edit, Eye, Calendar, Clock, User, Search, RefreshCw, 
  AlertTriangle, AlertCircle, MessageSquare, CheckCircle, XCircle,
  Filter, Download, FileText, Shield, Activity, Thermometer,
  ChevronDown, ChevronUp, Stethoscope, UserX, TrendingUp, TrendingDown,
  AlertOctagon, Info, Clock3, CheckSquare, Square, MoreVertical,
  FileText as FileTextIcon
} from 'lucide-react';

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

interface SideEffectUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sideEffect: (SideEffect & { medicationId: string; effectIndex: number; medicationName: string }) | null;
  patientName: string;
  onUpdate: (updates: { resolved: boolean; doctorNotes: string }) => void;
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

const SideEffectUpdateModal: React.FC<SideEffectUpdateModalProps> = ({
  isOpen,
  onClose,
  sideEffect,
  patientName,
  onUpdate
}) => {
  const [resolved, setResolved] = useState(sideEffect?.resolved || false);
  const [doctorNotes, setDoctorNotes] = useState(sideEffect?.doctorNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (sideEffect) {
      setResolved(sideEffect.resolved || false);
      setDoctorNotes(sideEffect.doctorNotes || '');
    }
  }, [sideEffect]);

  if (!isOpen || !sideEffect) return null;

  const handleSubmit = async () => {
    if (!sideEffect) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate({ resolved, doctorNotes });
      onClose();
    } catch (error) {
      console.error('Error updating side effect:', error);
      alert('Failed to update side effect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Update Side Effect</h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium">{patientName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Medication</p>
              <p className="font-medium">{sideEffect.medicationName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Side Effect</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="font-medium">{sideEffect.sideEffectName}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  sideEffect.severity === 'severe' ? 'bg-red-100 text-red-800' :
                  sideEffect.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {sideEffect.severity}
                </span>
                {sideEffect.intensity && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    sideEffect.intensity === 'very severe' ? 'bg-red-200 text-red-900' :
                    sideEffect.intensity === 'severe' ? 'bg-red-100 text-red-800' :
                    sideEffect.intensity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sideEffect.intensity}
                  </span>
                )}
              </div>
            </div>

            {sideEffect.notes && (
              <div>
                <p className="text-sm text-gray-600">Patient Notes</p>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">{sideEffect.notes}</p>
              </div>
            )}

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={resolved}
                  onChange={(e) => setResolved(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 text-blue-600 rounded disabled:opacity-50"
                />
                <span className="text-sm font-medium text-gray-700">Mark as resolved</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Notes
              </label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Add your notes, advice, or instructions for this side effect..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DoctorMedicationManagement: React.FC<DoctorMedicationManagementProps> = ({ patient, onMedicationSelect }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'stopped' | 'completed'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMedications, setExpandedMedications] = useState<{ [key: string]: boolean }>({});
  const [sideEffectModal, setSideEffectModal] = useState<{
    isOpen: boolean;
    sideEffect: null | (SideEffect & { medicationId: string; effectIndex: number; medicationName: string });
    patientName: string;
  }>({
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

  // Helper function to get patient name - FIXED
  const getPatientName = (patientId: string | PatientInfo): string => {
    if (typeof patientId === 'string') {
      // If we're viewing a specific patient and the ID matches
      if (patient && patient.id === patientId) {
        return patient.fullName;
      }
      return 'Unknown Patient';
    }
    // If it's a PatientInfo object
    return patientId.fullName || 'Unknown Patient';
  };

  // Helper function to get patient email
  const getPatientEmail = (patientId: string | PatientInfo): string | undefined => {
    if (typeof patientId === 'string') {
      return undefined;
    }
    return patientId.email;
  };

  // Helper function to get patient ID
  const getPatientId = (patientId: string | PatientInfo): string => {
    if (typeof patientId === 'string') {
      return patientId;
    }
    return patientId._id;
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'stopped':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'missed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
      case 'very severe':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'mild':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="w-4 h-4" />;
      case 'stopped':
        return <UserX className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Pill className="w-4 h-4" />;
    }
  };

  // Helper function to get adherence icon
  const getAdherenceIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'missed':
        return <Square className="w-4 h-4 text-orange-600" />;
      case 'stopped':
        return <UserX className="w-4 h-4 text-red-600" />;
      default:
        return <Clock3 className="w-4 h-4 text-gray-600" />;
    }
  };

  // Helper function to get adherence color
  const getAdherenceColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'missed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'stopped':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        // View specific patient's medications
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/doctor-view/${patient.id}`;
        isPatientView = true;
        console.log(`🔄 Fetching medications for patient: ${patient.fullName} (${patient.id})`);
      } else {
        // Get side effects summary for all patients
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
          // Handle patient-specific view
          if (data.success && data.data) {
            const medicationsData = data.data.medications || [];
            console.log(`📊 Found ${medicationsData.length} medications in response`);
            
            transformedMedications = medicationsData.map((med: any, index: number) => {
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

              return {
                id: med._id || med.id || `med-${index}-${Date.now()}`,
                _id: med._id || med.id,
                medicationName: med.medicationName || 'Unknown Medication',
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
              };
            });
            
            console.log(`🏁 Successfully transformed ${transformedMedications.length} medications`);
          } else {
            console.warn(`⚠️ No medication data found for patient:`, data);
          }
        } else {
          // Handle summary view for all patients
          if (data.success && data.data) {
            const allSideEffects = data.data.recentSideEffects || [];
            console.log(`📊 Found ${allSideEffects.length} side effects in summary`);
            
            // Group side effects by medication
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
              medicationsMap.get(key).experiencedSideEffects.push({
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

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/${medicationId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("✅ Medication deleted successfully");
        setMedications(prev => prev.filter(med => med.id !== medicationId));
        alert('Medication prescription deleted successfully');
        fetchDoctorPrescriptions(); // Refresh to update stats
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to delete medication:', errorData);
        alert(`Failed to delete medication: ${errorData.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Error deleting medication prescription. Please try again.');
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

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/${medicationId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        console.log("✅ Medication status updated successfully");
        setMedications(prev =>
          prev.map(med =>
            med.id === medicationId ? { ...med, status: newStatus } : med
          )
        );
        alert('Medication status updated successfully');
        fetchDoctorPrescriptions(); // Refresh to get updated stats
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to update medication status:', errorData);
        alert(`Failed to update medication status: ${errorData.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error updating medication status:', error);
      alert('Error updating medication status. Please try again.');
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
         // Check both severity and intensity
         return se.severity === filterSeverity || 
                (se.intensity && se.intensity === filterSeverity);
       }));
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Calculate patient count for stats
  const patientCount = [...new Set(medications.map(m => 
    getPatientId(m.patientId)
  ))].length;

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
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
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
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total Medications</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalMedications}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pill className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${stats.active > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {stats.active} active
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${stats.stopped > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {stats.stopped} stopped
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${stats.completed > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {stats.completed} completed
                </span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 mb-1">Total Side Effects</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.totalSideEffects}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${stats.severeSideEffects > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {stats.severeSideEffects} severe
                </span>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 mb-1">Unresolved Issues</p>
                  <p className="text-2xl font-bold text-red-900">{stats.unresolvedSideEffects}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-red-600 mt-2 font-medium">Requires attention</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 mb-1">Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{patientCount}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">With medications</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search medications or patients..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="stopped">Stopped</option>
              <option value="completed">Completed</option>
            </select>

            <select
              className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
            >
              <option value="all">All Severity</option>
              <option value="severe">Severe</option>
              <option value="moderate">Moderate</option>
              <option value="mild">Mild</option>
            </select>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterSeverity('all');
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Showing {filteredMedications.length} of {medications.length} medications
                  {patient && ` for ${patient.fullName}`}
                </p>
                {(searchTerm || filterStatus !== 'all' || filterSeverity !== 'all') && (
                  <p className="text-xs text-blue-600 mt-1">
                    Active filters: 
                    {searchTerm && ` Search: "${searchTerm}"`}
                    {filterStatus !== 'all' && ` Status: ${filterStatus}`}
                    {filterSeverity !== 'all' && ` Severity: ${filterSeverity}`}
                  </p>
                )}
              </div>
              {filteredMedications.length === 0 && medications.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterSeverity('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters to view all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Medications Grid */}
        <div className="p-6">
          {filteredMedications.length === 0 && medications.length > 0 ? (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMedications.map(medication => {
                const isExpanded = expandedMedications[medication.id];
                const sideEffects = medication.experiencedSideEffects || [];
                const hasSideEffects = sideEffects.length > 0;
                const hasSevereSideEffects = sideEffects.some(se => 
                  se.severity === 'severe' || se.intensity === 'severe' || se.intensity === 'very severe'
                );
                const hasUnresolved = sideEffects.some(se => !se.resolved);
                const adherenceStatus = medication.adherence?.currentStatus || 'unknown';
                const patientName = getPatientName(medication.patientId);

                return (
                  <div
                    key={medication.id}
                    className={`border rounded-xl hover:shadow-lg transition-all duration-200 bg-white ${
                      medication.status === 'stopped' ? 'border-red-300' :
                      medication.status === 'active' ? 'border-green-300' :
                      medication.status === 'completed' ? 'border-blue-300' :
                      'border-gray-300'
                    } ${isExpanded ? 'ring-2 ring-blue-100' : ''}`}
                  >
                    <div className="p-5">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Pill className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-lg truncate" title={medication.medicationName}>
                                {medication.medicationName}
                              </h4>
                              {!patient && (
                                <p className="text-sm text-gray-600 truncate" title={patientName}>
                                  <User className="w-3 h-3 inline mr-1" />
                                  {patientName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(medication.status)}`}>
                              {getStatusIcon(medication.status)}
                              <span className="ml-2">{medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}</span>
                            </span>
                            <div className={`px-2 py-1.5 rounded text-xs font-medium ${getAdherenceColor(adherenceStatus)} flex items-center`}>
                              {getAdherenceIcon(adherenceStatus)}
                              <span className="ml-1">{adherenceStatus}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 ml-2">
                          {medication.status === 'active' && (
                            <>
                              <button
                                onClick={() => updateMedicationStatus(medication.id, 'completed')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                                title="Mark as completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateMedicationStatus(medication.id, 'stopped')}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-200"
                                title="Stop prescription"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteMedication(medication.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                            title="Delete prescription"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleMedicationExpand(medication.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Medication Details */}
                      <div className="space-y-3 text-sm text-gray-600 mb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-700 text-xs uppercase tracking-wide">Dosage</p>
                            <p className="mt-1 font-semibold">{medication.dosage}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-700 text-xs uppercase tracking-wide">Frequency</p>
                            <p className="mt-1 font-semibold">{medication.frequency}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-700 text-xs uppercase tracking-wide">Started</p>
                          <p className="mt-1">{formatDate(medication.startDate)}</p>
                        </div>
                        
                        {medication.instructions && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="font-medium text-blue-700 text-xs uppercase tracking-wide">Instructions</p>
                            <p className="mt-1 text-sm">{medication.instructions}</p>
                          </div>
                        )}
                      </div>

                      {/* Side Effects Summary */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${hasSideEffects ? (hasSevereSideEffects ? 'bg-red-100' : 'bg-orange-100') : 'bg-green-100'}`}>
                              <AlertCircle className={`w-4 h-4 ${hasSideEffects ? (hasSevereSideEffects ? 'text-red-600' : 'text-orange-600') : 'text-green-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Side Effects</p>
                              <p className="text-xs text-gray-500">
                                {hasSideEffects ? `${sideEffects.length} reported` : 'None reported'}
                                {hasUnresolved && ` • ${sideEffects.filter(se => !se.resolved).length} unresolved`}
                              </p>
                            </div>
                          </div>
                          {hasSideEffects && (
                            <button
                              onClick={() => toggleMedicationExpand(medication.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {isExpanded ? 'Hide details' : 'View details'}
                            </button>
                          )}
                        </div>
                        
                        {hasSideEffects && !isExpanded && (
                          <div className="flex flex-wrap gap-2">
                            {sideEffects.slice(0, 3).map((effect, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getSeverityColor(effect.severity)}`}
                                title={`${effect.sideEffectName} - ${effect.severity}`}
                              >
                                {effect.sideEffectName}
                                {effect.resolved && (
                                  <CheckCircle className="w-3 h-3 inline ml-1" />
                                )}
                              </span>
                            ))}
                            {sideEffects.length > 3 && (
                              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-800">
                                +{sideEffects.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Patient Allergies */}
                      {medication.patientAllergies && medication.patientAllergies.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Thermometer className="w-4 h-4 text-red-600" />
                            <p className="font-medium text-gray-700">Patient Allergies</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {medication.patientAllergies.map((allergy, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-medium border border-red-200"
                                title={`Severity: ${allergy.severity}`}
                              >
                                {allergy.allergyName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stopped Medication Reason */}
                      {medication.status === 'stopped' && medication.adherence?.reasonForStopping && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <UserX className="w-4 h-4 text-red-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Patient Stopped Taking</p>
                              <p className="text-sm text-red-700 mt-1">{medication.adherence.reasonForStopping}</p>
                              {medication.adherence.stoppedAt && (
                                <p className="text-xs text-red-600 mt-2">
                                  Stopped on: {formatDate(medication.adherence.stoppedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded View */}
                      {isExpanded && (
                        <div className="mt-5 border-t pt-5 space-y-5">
                          {/* Experienced Side Effects Details */}
                          {hasSideEffects && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900 flex items-center">
                                  <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                                  Reported Side Effects ({sideEffects.length})
                                </h5>
                                <div className="text-sm text-gray-500">
                                  {sideEffects.filter(se => se.resolved).length} resolved
                                </div>
                              </div>
                              
                              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {sideEffects.map((effect, index) => (
                                  <div key={index} className={`p-3 rounded-lg border ${effect.resolved ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <span className="font-medium text-gray-900">{effect.sideEffectName}</span>
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(effect.severity)}`}>
                                            {effect.severity}
                                          </span>
                                          {effect.resolved && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center">
                                              <CheckCircle className="w-3 h-3 mr-1" />
                                              Resolved
                                            </span>
                                          )}
                                        </div>
                                        
                                        {effect.notes && (
                                          <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Patient notes:</span> {effect.notes}
                                          </p>
                                        )}
                                        
                                        {effect.doctorNotes && (
                                          <div className="mb-2 p-2 bg-white rounded border">
                                            <p className="text-xs font-medium text-blue-700 mb-1">Doctor Notes:</p>
                                            <p className="text-sm text-gray-700">{effect.doctorNotes}</p>
                                          </div>
                                        )}
                                        
                                        <p className="text-xs text-gray-500">
                                          Reported: {formatDate(effect.reportedAt)}
                                          {effect.lastUpdated && ` • Updated: ${formatDate(effect.lastUpdated)}`}
                                          {effect.resolvedAt && ` • Resolved: ${formatDate(effect.resolvedAt)}`}
                                        </p>
                                      </div>
                                      
                                      <button
                                        onClick={() => openSideEffectModal(effect, medication.id, index, medication.medicationName)}
                                        className="ml-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                                        title="Update side effect"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Potential Side Effects */}
                          {medication.potentialSideEffects && medication.potentialSideEffects.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                Potential Side Effects
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {medication.potentialSideEffects.map((effect, index) => (
                                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{effect.name}</span>
                                      <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(effect.severity)}`}>
                                        {effect.severity}
                                      </span>
                                    </div>
                                    {effect.description && (
                                      <p className="text-xs text-gray-600 mt-1">{effect.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorMedicationManagement;