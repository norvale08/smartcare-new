// app/caretaker/components/PatientHistoryModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Heart, Activity, Pill, Download } from 'lucide-react';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

interface MedicalHistory {
  vitals: any[];
  medications: any[];
  appointments: any[];
  conditions: any[];
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  const [history, setHistory] = useState<MedicalHistory>({
    vitals: [],
    medications: [],
    appointments: [],
    conditions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vitals' | 'medications' | 'appointments' | 'conditions'>('vitals');

  useEffect(() => {
    if (isOpen && patient) {
      fetchPatientHistory();
    }
  }, [isOpen, patient]);

  const fetchPatientHistory = async () => {
    if (!patient) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log('🔄 Fetching history for patient:', patient.id);

      // Helper function to safely fetch data
      const safeFetch = async (url: string): Promise<any[]> => {
        try {
          console.log(`🌐 Fetching from: ${url}`);
          const response = await fetch(url, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log(`📡 Response status: ${response.status}`);
          
          if (!response.ok) {
            console.warn(`⚠️ API call failed for ${url}:`, response.status);
            return [];
          }

          const data = await response.json();
          console.log(`✅ Data received from ${url}:`, data);
          
          // Handle different response structures
          if (Array.isArray(data)) {
            return data;
          } else if (data && Array.isArray(data.data)) {
            return data.data;
          } else if (data && Array.isArray(data.vitals)) {
            return data.vitals;
          } else if (data && Array.isArray(data.medications)) {
            return data.medications;
          } else if (data && Array.isArray(data.appointments)) {
            return data.appointments;
          } else if (data && typeof data === 'object') {
            // If it's a single object, wrap in array
            return [data];
          } else {
            console.warn('⚠️ Unexpected data structure:', data);
            return [];
          }
        } catch (error) {
          console.error(`❌ Error fetching ${url}:`, error);
          return [];
        }
      };

      // Use correct API endpoints based on your routes
      const [vitals, medications, appointments] = await Promise.all([
        // Vitals - using the correct endpoint from patientVitalsRouter
        safeFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/patient/vitals/${patient.id}`),
        
        // Medications - using the patient medications endpoint
        safeFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/patient/${patient.id}`),
        safeFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medicine/patient/${patient.id}`),
  
        // Appointments - we need to check what's available, using a placeholder for now
        safeFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/doctorDashboard/appointments/${patient.id}`)
      ]);

      console.log('📊 History data fetched:', {
        vitals: vitals.length,
        medications: medications.length,
        appointments: appointments.length
      });

      setHistory({
        vitals,
        medications,
        appointments,
        conditions: [] // You can add conditions later
      });
    } catch (error) {
      console.error('❌ Error fetching patient history:', error);
      setHistory({
        vitals: [],
        medications: [],
        appointments: [],
        conditions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Safe array accessor
  const getSafeArray = (data: any): any[] => {
    return Array.isArray(data) ? data : [];
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-history-${patient.fullName}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Medical History - {patient.fullName}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportHistory}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'vitals' as const, label: 'Vitals', icon: Heart },
              { key: 'medications' as const, label: 'Medications', icon: Pill },
              { key: 'appointments' as const, label: 'Appointments', icon: Calendar },
              { key: 'conditions' as const, label: 'Conditions', icon: Activity }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {getSafeArray(history[key]).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading history...</p>
            </div>
          ) : (
            <>
              {/* Vitals Tab */}
              {activeTab === 'vitals' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Vital Signs History</h3>
                  {getSafeArray(history.vitals).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No vitals recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {getSafeArray(history.vitals).map((vital: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {vital.systolic && `${vital.systolic}/${vital.diastolic} mmHg`}
                                {vital.glucose && `Glucose: ${vital.glucose} mg/dL`}
                                {vital.heartRate && ` • HR: ${vital.heartRate} bpm`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {vital.timestamp ? formatDate(vital.timestamp) : 'No date recorded'}
                              </p>
                              {vital.context && (
                                <p className="text-sm text-gray-600 mt-1">Context: {vital.context}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Medication History</h3>
                  {getSafeArray(history.medications).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No medications prescribed</p>
                  ) : (
                    <div className="space-y-3">
                      {getSafeArray(history.medications).map((med: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{med.medicationName || 'Unknown Medication'}</p>
                              <p className="text-sm text-gray-600">
                                {med.dosage} • {med.frequency} • {med.duration}
                              </p>
                              <p className="text-sm text-gray-500">
                                Prescribed: {med.createdAt ? formatDate(med.createdAt) : 'Unknown date'}
                              </p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                                med.status === 'active' ? 'bg-green-100 text-green-800' :
                                med.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {med.status || 'unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Appointment History</h3>
                  {getSafeArray(history.appointments).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No appointments found</p>
                  ) : (
                    <div className="space-y-3">
                      {getSafeArray(history.appointments).map((appointment: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{appointment.type || 'Follow-up'}</p>
                              <p className="text-sm text-gray-600">{appointment.notes || 'No notes'}</p>
                              <p className="text-sm text-gray-500">
                                {appointment.scheduledDate ? formatDate(appointment.scheduledDate) : 'No date scheduled'}
                              </p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.status || 'unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Conditions Tab */}
              {activeTab === 'conditions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Medical Conditions</h3>
                  {getSafeArray(history.conditions).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No conditions recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {getSafeArray(history.conditions).map((condition: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{condition.name || 'Unknown Condition'}</p>
                              <p className="text-sm text-gray-600">
                                Diagnosed: {condition.diagnosedDate ? formatDate(condition.diagnosedDate) : 'Unknown date'}
                              </p>
                              <p className="text-sm text-gray-500">{condition.notes || 'No notes'}</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                                condition.status === 'active' ? 'bg-red-100 text-red-800' :
                                condition.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {condition.status || 'unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;