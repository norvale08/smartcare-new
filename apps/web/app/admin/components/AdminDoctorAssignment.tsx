import React, { useState, useEffect } from 'react';
import { Search, Users, UserCheck, UserX, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button, Card, Input } from '@repo/ui';
import { useTranslation } from '../../../lib/hypertension/useTranslation';
import { toast } from 'react-hot-toast';

interface DoctorAssignmentProps {
  refreshTrigger: () => void;
}

interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  email: string;
  patientCount?: number;
  assignedPatients?: Patient[];
}

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  assignedDoctor?: {
    id: string;
    fullName: string;
    specialization: string;
  };
  assignmentSource?: string;
  condition?: string;
}

// Custom Badge component since @repo/ui doesn't have it
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-cyan-100 text-cyan-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    outline: 'bg-transparent border border-gray-300 text-gray-700'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const AdminDoctorAssignment: React.FC<DoctorAssignmentProps> = ({ refreshTrigger }) => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  };

  // Helper function to safely get token
  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  // Fetch doctors with patient counts
  const fetchDoctors = async () => {
    try {
      const token = getToken();
      
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      const response = await fetch(`${getApiBaseUrl()}/api/admin/doctors`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.doctors) {
          // Format doctors
          const formattedDoctors = data.doctors.map((doctor: any) => ({
            id: doctor.id || doctor._id,
            fullName: doctor.fullName || `${doctor.firstName} ${doctor.lastName}`,
            email: doctor.email,
            specialization: doctor.specialization || 'General Practice',
            patientCount: doctor.patientCount || 0,
            assignedPatients: []
          }));
          
          setDoctors(formattedDoctors);
        }
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const token = getToken();
      
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      const response = await fetch(`${getApiBaseUrl()}/api/admin/patients`, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Patients data from API:', data); // Debug log
        
        if (data.success && data.patients) {
          const formattedPatients = data.patients.map((patient: any) => {
            console.log('Processing patient:', patient); // Debug log
            
            // Handle assignedDoctor - it might be null, string, or object
            let assignedDoctorInfo = undefined;
            if (patient.assignedDoctor) {
              if (typeof patient.assignedDoctor === 'object' && patient.assignedDoctor !== null) {
                // It's an object
                assignedDoctorInfo = {
                  id: patient.assignedDoctor.id || patient.assignedDoctor._id,
                  fullName: patient.assignedDoctor.fullName || 
                           `${patient.assignedDoctor.firstName || ''} ${patient.assignedDoctor.lastName || ''}`.trim(),
                  specialization: patient.assignedDoctor.specialization || 'General Practice'
                };
              } else if (typeof patient.assignedDoctor === 'string') {
                // It's a string ID - we need to find the doctor object
                assignedDoctorInfo = {
                  id: patient.assignedDoctor,
                  fullName: 'Unknown Doctor',
                  specialization: 'General Practice'
                };
              }
            }
            
            return {
              id: patient.id || patient._id,
              fullName: patient.fullName || 'Unknown Patient',
              email: patient.email || '',
              phoneNumber: patient.phoneNumber || '',
              assignedDoctor: assignedDoctorInfo,
              assignmentSource: patient.assignmentSource || 'unassigned',
              condition: patient.condition || 'Unknown'
            };
          });
          
          setPatients(formattedPatients);
          console.log('Formatted patients:', formattedPatients); // Debug log
          
          // Update doctors with their assigned patients
          updateDoctorsWithPatients(formattedPatients);
        }
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Update doctors with their assigned patients
  const updateDoctorsWithPatients = (patientList: Patient[]) => {
    setDoctors(prevDoctors => {
      return prevDoctors.map(doctor => {
        const assignedPatients = patientList.filter(patient => 
          patient.assignedDoctor?.id === doctor.id
        );
        
        return {
          ...doctor,
          patientCount: assignedPatients.length,
          assignedPatients: assignedPatients
        };
      });
    });
  };

  const fetchDoctorsAndPatients = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDoctors(), fetchPatients()]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPatient = async (patientId: string) => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor first');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      const loadingToast = toast.loading('Assigning patient...');
      
      const response = await fetch(`${getApiBaseUrl()}/api/admin/doctor-assignments/assign-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          patientId: patientId
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Patient assigned successfully!', { id: loadingToast });
        refreshTrigger();
        fetchPatients(); // Refresh to get updated assignments
        return true;
      } else {
        toast.error(result.message || 'Failed to assign patient', { id: loadingToast });
        return false;
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Error assigning patient');
      return false;
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor first');
      return;
    }

    if (selectedPatients.length === 0) {
      toast.error('Please select at least one patient');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      const loadingToast = toast.loading(`Assigning ${selectedPatients.length} patients...`);
      
      const response = await fetch(`${getApiBaseUrl()}/api/admin/doctor-assignments/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          patientIds: selectedPatients
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully assigned ${selectedPatients.length} patients!`, { 
          id: loadingToast,
          duration: 3000 
        });
        refreshTrigger();
        fetchPatients();
        setSelectedDoctor(null);
        setSelectedPatients([]);
      } else {
        toast.error(result.message || 'Failed to assign patients', { id: loadingToast });
      }
    } catch (error) {
      console.error('Bulk assignment error:', error);
      toast.error('Error assigning patients');
    }
  };

  useEffect(() => {
    fetchDoctorsAndPatients();
  }, []);

  // Filter patients based on search and filters
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phoneNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAssignedFilter = showAssignedOnly ? patient.assignedDoctor : true;
    const matchesUnassignedFilter = showUnassignedOnly ? !patient.assignedDoctor : true;
    
    return matchesSearch && matchesAssignedFilter && matchesUnassignedFilter;
  });

  // Get patients for selected doctor
  const selectedDoctorPatients = selectedDoctor 
    ? patients.filter(patient => patient.assignedDoctor?.id === selectedDoctor)
    : [];

  // Get selected doctor details
  const selectedDoctorDetails = selectedDoctor 
    ? doctors.find(d => d.id === selectedDoctor)
    : null;

  // Color functions for the theme
  const getDoctorCardColor = (index: number) => {
    const colors = ['bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200', 
                    'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200',
                    'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'];
    return colors[index % colors.length];
  };

  const getPatientStatusColor = (patient: Patient) => {
    if (!patient.assignedDoctor) return 'bg-gradient-to-r from-cyan-100 to-blue-100 border-cyan-300';
    if (patient.assignedDoctor.id === selectedDoctor) return 'bg-gradient-to-r from-emerald-100 to-cyan-100 border-emerald-300';
    return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200';
  };

  // Get doctor's assigned patients count
  const getDoctorPatientCount = (doctorId: string) => {
    return patients.filter(p => p.assignedDoctor?.id === doctorId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-cyan-600" />
            {t.admin?.doctor_assignment || "Doctor Assignment"}
          </h2>
          <p className="text-gray-600 mt-1">Manage doctor-patient assignments efficiently</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              console.log('Current doctors:', doctors);
              console.log('Current patients:', patients);
            }}
            className="flex items-center gap-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
          >
            {/* <AlertCircle className="w-4 h-4" />
            Debug */}
          </Button>
          <Button
            variant="outline"
            onClick={fetchDoctorsAndPatients}
            disabled={loading}
            className="flex items-center gap-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Doctors List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Doctors Selection Card */}
          <div className="bg-white p-6 rounded-xl border border-cyan-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-600" />
              Select Doctor
            </h3>
            
            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Choose a Doctor
              </label>
              <select
                value={selectedDoctor || ''}
                onChange={(e) => {
                  setSelectedDoctor(e.target.value);
                  setExpandedDoctor(e.target.value);
                }}
                className="w-full p-3 border border-cyan-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                disabled={loading || doctors.length === 0}
              >
                <option value="">Select a doctor...</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName} ({doctor.specialization}) - {getDoctorPatientCount(doctor.id)} patients
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Doctor Details */}
            {selectedDoctorDetails && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200">
                <h4 className="font-semibold text-gray-900 mb-2">Selected Doctor</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{selectedDoctorDetails.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Specialization:</span>
                    <span className="font-medium text-gray-900">{selectedDoctorDetails.specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assigned Patients:</span>
                    <span className="font-medium text-emerald-600">
                      {getDoctorPatientCount(selectedDoctor!)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Doctors List */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">All Doctors ({doctors.length})</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {doctors.map((doctor, index) => {
                  const doctorPatients = patients.filter(p => p.assignedDoctor?.id === doctor.id);
                  const patientCount = doctorPatients.length;
                  
                  return (
                    <div
                      key={doctor.id}
                      className={`p-4 rounded-xl border ${getDoctorCardColor(index)} cursor-pointer transition-all hover:scale-[1.02] ${
                        selectedDoctor === doctor.id ? 'ring-2 ring-cyan-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedDoctor(doctor.id);
                        setExpandedDoctor(doctor.id === expandedDoctor ? null : doctor.id);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-semibold text-gray-900">{doctor.fullName}</h5>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                          <p className="text-xs text-gray-500 mt-1">{doctor.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={patientCount > 0 ? "success" : "secondary"}
                            className="px-2 py-1"
                          >
                            {patientCount} patient{patientCount !== 1 ? 's' : ''}
                          </Badge>
                          {expandedDoctor === doctor.id ? (
                            <ChevronUp className="w-4 h-4 text-cyan-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-cyan-600" />
                          )}
                        </div>
                      </div>
                      
                      {expandedDoctor === doctor.id && (
                        <div className="mt-3 pt-3 border-t border-cyan-200">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-xs font-medium text-gray-700">Assigned Patients ({patientCount}):</h6>
                            {patientCount > 0 && (
                              <span className="text-xs text-cyan-600">
                                Click patient to view details
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {doctorPatients.length > 0 ? (
                              doctorPatients.map(patient => (
                                <div 
                                  key={patient.id} 
                                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-cyan-100 hover:bg-cyan-50 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // You can add a modal or side panel to show patient details
                                    console.log('Patient clicked:', patient);
                                  }}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900">{patient.fullName}</span>
                                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                        {patient.condition || 'General'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{patient.email}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {patient.assignmentSource || 'manual'}
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4">
                                <UserX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">No patients assigned yet</p>
                                <p className="text-xs text-gray-400 mt-1">Select this doctor and assign patients</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Patients List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters Card */}
          <div className="bg-white p-6 rounded-xl border border-cyan-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-600" />
                  Patients ({patients.length})
                </h3>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600">
                    {selectedDoctor 
                      ? `Showing ${selectedDoctorPatients.length} patients assigned to Dr. ${selectedDoctorDetails?.fullName}` 
                      : 'All patients in the system'}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {patients.filter(p => p.assignedDoctor).length} assigned
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {patients.filter(p => !p.assignedDoctor).length} unassigned
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={showAssignedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowAssignedOnly(!showAssignedOnly);
                    if (!showAssignedOnly) setShowUnassignedOnly(false);
                  }}
                  className={`flex items-center gap-2 ${showAssignedOnly ? 'bg-cyan-600 text-white' : 'border-cyan-300 text-cyan-700'}`}
                >
                  <UserCheck className="w-4 h-4" />
                  Assigned ({patients.filter(p => p.assignedDoctor).length})
                </Button>
                
                <Button
                  variant={showUnassignedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowUnassignedOnly(!showUnassignedOnly);
                    if (!showUnassignedOnly) setShowAssignedOnly(false);
                  }}
                  className={`flex items-center gap-2 ${showUnassignedOnly ? 'bg-emerald-600 text-white' : 'border-emerald-300 text-emerald-700'}`}
                >
                  <UserX className="w-4 h-4" />
                  Unassigned ({patients.filter(p => !p.assignedDoctor).length})
                </Button>
                
                {(showAssignedOnly || showUnassignedOnly) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAssignedOnly(false);
                      setShowUnassignedOnly(false);
                    }}
                    className="border-gray-300 text-gray-700"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-cyan-500" />
              <Input
                placeholder="Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 border-cyan-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-xl"
                disabled={loading}
              />
            </div>

            {/* Patients List */}
            <div className="border border-cyan-200 rounded-xl overflow-hidden">
              <div className="overflow-y-auto max-h-[500px]">
                <div className="min-h-[300px]">
                  {filteredPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mb-4 text-cyan-200" />
                      <p className="text-lg font-medium mb-2">No patients found</p>
                      <p className="text-sm text-center max-w-md">
                        {searchTerm 
                          ? `No patients match "${searchTerm}". Try adjusting your search or filters.` 
                          : "There are no patients in the system matching your filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-cyan-100">
                      {filteredPatients.map(patient => {
                        const isAssignedToSelectedDoctor = selectedDoctor && patient.assignedDoctor?.id === selectedDoctor;
                        const isUnassigned = !patient.assignedDoctor;
                        
                        return (
                          <div 
                            key={patient.id} 
                            className={`p-4 transition-colors ${getPatientStatusColor(patient)} ${
                              selectedPatients.includes(patient.id) ? 'ring-2 ring-cyan-500' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedPatients.includes(patient.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedPatients([...selectedPatients, patient.id]);
                                      } else {
                                        setSelectedPatients(selectedPatients.filter(id => id !== patient.id));
                                      }
                                    }}
                                    className="rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500 mt-1"
                                  />
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-sm text-gray-600">{patient.email}</span>
                                      {patient.phoneNumber && (
                                        <span className="text-sm text-gray-500">• {patient.phoneNumber}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="ml-7">
                                  {patient.assignedDoctor ? (
                                    <div className="flex items-center gap-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-medium text-gray-900">
                                          Assigned to: {patient.assignedDoctor.fullName}
                                        </span>
                                      </div>
                                      <Badge 
                                        variant={patient.assignedDoctor.id === selectedDoctor ? "success" : "secondary"}
                                        className="text-xs"
                                      >
                                        {patient.assignedDoctor.specialization}
                                      </Badge>
                                      <Badge 
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {patient.assignmentSource || 'manual'}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 mt-2">
                                      <UserX className="w-4 h-4 text-cyan-500" />
                                      <span className="text-sm font-medium text-cyan-700">Unassigned</span>
                                      {selectedDoctor && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleAssignPatient(patient.id)}
                                          className="ml-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-xs"
                                        >
                                          Assign to Selected Doctor
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {patient.assignedDoctor && selectedDoctor && !isAssignedToSelectedDoctor && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 text-xs"
                                  onClick={() => handleAssignPatient(patient.id)}
                                >
                                  Reassign
                                </Button>
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

            {/* Bulk Actions */}
            {selectedPatients.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-xl border border-cyan-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-cyan-300">
                      <UserCheck className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedPatients.length} patients selected</p>
                      <p className="text-sm text-gray-600">
                        {selectedDoctor 
                          ? `Will be assigned to Dr. ${selectedDoctorDetails?.fullName}` 
                          : 'Select a doctor to assign'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPatients([])}
                      className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                    >
                      Clear Selection
                    </Button>
                    
                    <Button
                      onClick={handleBulkAssign}
                      disabled={!selectedDoctor || loading}
                      className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Assign Selected ({selectedPatients.length})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Summary */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                <p className="text-sm font-medium text-cyan-700">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-200">
                <p className="text-sm font-medium text-emerald-700">Assigned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.assignedDoctor).length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <p className="text-sm font-medium text-blue-700">Unassigned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => !p.assignedDoctor).length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-xl border border-cyan-200">
                <p className="text-sm font-medium text-gray-700">Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedPatients.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDoctorAssignment;