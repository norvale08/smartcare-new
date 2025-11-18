// app/caretaker/components/DoctorMedicationManagement.tsx
import React, { useState, useEffect } from 'react';
import { Pill, Trash2, Edit, Eye, Calendar, Clock, User, Search, RefreshCw } from 'lucide-react';

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

interface Medication {
  _id?: string;
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminders: string[];
  status: 'active' | 'completed' | 'missed' | 'cancelled';
  startDate: string;
  patientId: string | PatientInfo;
  prescribedBy: string | DoctorInfo;
  createdAt: string;
  lastTaken?: string;
}

interface DoctorMedicationManagementProps {
  patient?: {
    id: string;
    fullName: string;
  };
}

const DoctorMedicationManagement: React.FC<DoctorMedicationManagementProps> = ({ patient }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDoctorPrescriptions();
  }, [patient]);

  const fetchDoctorPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("❌ No token found");
        setMedications([]);
        return;
      }

      // Try the correct endpoint for doctor's prescriptions
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/prescribe/my-prescriptions`;

      console.log(`🔄 Fetching doctor prescriptions from: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`📡 Response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Doctor prescriptions received:`, data);
        
        let medicationsData: any[] = [];
        
        // Handle different response structures
        if (Array.isArray(data)) {
          medicationsData = data;
        } else if (Array.isArray(data.data)) {
          medicationsData = data.data;
        } else if (Array.isArray(data.medications)) {
          medicationsData = data.medications;
        } else if (data.success && Array.isArray(data.data)) {
          medicationsData = data.data;
        }

        console.log(`✅ Found ${medicationsData.length} medications`);

        // Transform data to ensure consistent structure
        const transformedMedications: Medication[] = medicationsData.map(med => {
          // Handle patientId - it could be a string or object
          let patientId: string | PatientInfo;
          if (typeof med.patientId === 'string') {
            patientId = med.patientId;
          } else if (med.patientId && typeof med.patientId === 'object') {
            patientId = {
              _id: med.patientId._id || med.patientId.id || 'unknown',
              fullName: med.patientId.fullName || 'Unknown Patient',
              email: med.patientId.email,
              phoneNumber: med.patientId.phoneNumber
            };
          } else {
            patientId = 'unknown';
          }

          // Handle prescribedBy - it could be a string or object
          let prescribedBy: string | DoctorInfo;
          if (typeof med.prescribedBy === 'string') {
            prescribedBy = med.prescribedBy;
          } else if (med.prescribedBy && typeof med.prescribedBy === 'object') {
            prescribedBy = {
              _id: med.prescribedBy._id || med.prescribedBy.id || 'unknown',
              fullName: med.prescribedBy.fullName || 'Unknown Doctor',
              specialization: med.prescribedBy.specialization
            };
          } else {
            prescribedBy = 'unknown';
          }

          return {
            ...med,
            id: med._id || med.id || `temp-${Math.random()}`,
            patientId,
            prescribedBy,
            status: med.status || 'active',
            reminders: med.reminders || [],
            instructions: med.instructions || '',
            duration: med.duration || 'Not specified',
            medicationName: med.medicationName || 'Unknown Medication',
            dosage: med.dosage || 'Not specified',
            frequency: med.frequency || 'Not specified',
            startDate: med.startDate || med.createdAt || new Date().toISOString(),
            createdAt: med.createdAt || new Date().toISOString()
          };
        });

        // If we have a specific patient, filter the medications
        let finalMedications = transformedMedications;
        if (patient && transformedMedications.length > 0) {
          finalMedications = transformedMedications.filter(med => {
            if (typeof med.patientId === 'string') {
              return med.patientId === patient.id;
            } else {
              return med.patientId._id === patient.id;
            }
          });
          console.log(`👤 Filtered to ${finalMedications.length} medications for patient ${patient.id}`);
        }

        setMedications(finalMedications);
        console.log("🎯 Final medications state:", finalMedications);

      } else {
        console.error("❌ Failed to fetch doctor prescriptions:", response.status);
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching doctor prescriptions:', error);
      setMedications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication prescription?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("🗑️ Deleting medication:", medicationId);

      // Try multiple delete endpoints
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/${medicationId}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medicine/${medicationId}`
      ];

      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying delete endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(`📡 Delete response status:`, response.status);

          if (response.ok) {
            console.log("✅ Medication deleted successfully");
            setMedications(prev => prev.filter(med => med.id !== medicationId));
            alert('Medication prescription deleted successfully');
            success = true;
            break;
          } else if (response.status === 404) {
            console.log(`❌ Endpoint not found: ${endpoint}`);
            continue; // Try next endpoint
          } else {
            const errorData = await response.json();
            console.error(`❌ Failed to delete medication from ${endpoint}:`, errorData);
          }
        } catch (error) {
          console.log(`❌ Delete endpoint ${endpoint} failed:`, error);
        }
      }

      if (!success) {
        alert('Failed to delete medication prescription. No valid endpoint found.');
      }

    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Error deleting medication prescription');
    }
  };

  const updateMedicationStatus = async (medicationId: string, newStatus: 'active' | 'completed' | 'cancelled') => {
    try {
      const token = localStorage.getItem("token");
      console.log("📝 Updating medication status:", medicationId, newStatus);

      // Try multiple update endpoints
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/${medicationId}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medicine/${medicationId}`
      ];

      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying update endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          });

          console.log(`📡 Update response status:`, response.status);

          if (response.ok) {
            console.log("✅ Medication status updated successfully");
            setMedications(prev =>
              prev.map(med =>
                med.id === medicationId ? { ...med, status: newStatus } : med
              )
            );
            alert('Medication status updated successfully');
            success = true;
            break;
          } else if (response.status === 404) {
            console.log(`❌ Endpoint not found: ${endpoint}`);
            continue; // Try next endpoint
          } else {
            const errorData = await response.json();
            console.error(`❌ Failed to update medication status from ${endpoint}:`, errorData);
          }
        } catch (error) {
          console.log(`❌ Update endpoint ${endpoint} failed:`, error);
        }
      }

      if (!success) {
        alert('Failed to update medication status. No valid endpoint found.');
      }

    } catch (error) {
      console.error('Error updating medication status:', error);
      alert('Error updating medication status');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDoctorPrescriptions();
  };

  const filteredMedications = medications.filter(medication => {
    const matchesSearch = medication.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (typeof medication.patientId !== 'string' && 
                          medication.patientId.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || medication.status === filterStatus;
    const matchesPatient = !patient || 
      (typeof medication.patientId === 'string' 
        ? medication.patientId === patient.id 
        : medication.patientId._id === patient.id);
    
    return matchesSearch && matchesStatus && matchesPatient;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getPatientName = (patientId: string | PatientInfo): string => {
    if (typeof patientId === 'string') {
      return 'Unknown Patient';
    }
    return patientId.fullName || 'Unknown Patient';
  };

  const getPatientPhone = (patientId: string | PatientInfo): string | undefined => {
    if (typeof patientId === 'string') {
      return undefined;
    }
    return patientId.phoneNumber;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <span>Prescribed Medications</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {patient ? `Medications for ${patient.fullName}` : 'All medications prescribed by you'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total: {filteredMedications.length} prescriptions
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs">
        <div className="flex space-x-4">
          <span>📊 Total meds: {medications.length}</span>
          <span>🔍 Filtered: {filteredMedications.length}</span>
          <span>👤 Patient: {patient ? patient.id : 'All'}</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search medications or patients..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {filteredMedications.length === 0 ? (
        <div className="text-center py-8">
          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Medications Found</h4>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'No medications match your search criteria' 
              : patient 
                ? `No medications prescribed for ${patient.fullName} yet`
                : 'You haven\'t prescribed any medications yet'
            }
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
          >
            Click here to refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMedications.map(medication => (
            <div
              key={medication.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {medication.medicationName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(medication.status)}`}>
                      {medication.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Dosage:</strong> {medication.dosage}</p>
                      <p><strong>Frequency:</strong> {medication.frequency}</p>
                      <p><strong>Duration:</strong> {medication.duration}</p>
                    </div>
                    <div>
                      <p><strong>Start Date:</strong> {formatDate(medication.startDate)}</p>
                      <p><strong>Prescribed:</strong> {formatDate(medication.createdAt)}</p>
                      {medication.lastTaken && (
                        <p><strong>Last Taken:</strong> {formatDate(medication.lastTaken)}</p>
                      )}
                    </div>
                  </div>

                  {medication.instructions && (
                    <div className="mt-2">
                      <p className="text-sm"><strong>Instructions:</strong> {medication.instructions}</p>
                    </div>
                  )}

                  {medication.reminders && medication.reminders.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Reminder Times:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {medication.reminders.map(time => (
                          <span
                            key={time}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border"
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!patient && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>Patient: {getPatientName(medication.patientId)}</span>
                      {getPatientPhone(medication.patientId) && (
                        <span>• {getPatientPhone(medication.patientId)}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  {medication.status === 'active' && (
                    <>
                      <button
                        onClick={() => updateMedicationStatus(medication.id, 'completed')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as completed"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateMedicationStatus(medication.id, 'cancelled')}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Cancel prescription"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteMedication(medication.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete prescription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorMedicationManagement;