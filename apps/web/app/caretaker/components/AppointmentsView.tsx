// app/caretaker/components/AppointmentsView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Stethoscope, 
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import AppointmentSchedulerModal from './AppointmentSchedulerModal'; // Import the modal

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
  };
  doctorId: {
    _id: string;
    fullName: string;
    specialization?: string;
  };
  type: 'follow-up' | 'consultation' | 'check-up' | 'emergency';
  scheduledDate: string;
  duration: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentsViewProps {
  patient: any;
}

const AppointmentsView: React.FC<AppointmentsViewProps> = ({ patient }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  
  // State for appointment scheduling modal
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  useEffect(() => {
    console.log('🔍 AppointmentsView component mounted with patient:', patient);
    if (patient) {
      fetchAppointments();
    } else {
      console.log('⚠️ No patient data available');
    }
  }, [patient]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log('📅 Fetching appointments for patient:', patient.id);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/appointments/patient/${patient.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Appointments data:', result);

      if (result.success) {
        setAppointments(result.appointments || []);
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching appointments:', err);
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/appointments/${appointmentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update appointment: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId ? { ...apt, status: newStatus } : apt
          )
        );
        alert(`Appointment marked as ${newStatus}`);
      }
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment: ' + err.message);
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete appointment: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Remove from local state
        setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
        alert('Appointment deleted successfully');
      }
    } catch (err: any) {
      console.error('Error deleting appointment:', err);
      alert('Failed to delete appointment: ' + err.message);
    }
  };

  // Handler for successful appointment scheduling
  const handleScheduleSuccess = () => {
    // Refresh the appointments list
    fetchAppointments();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'follow-up':
        return <RefreshCw className="w-4 h-4" />;
      case 'consultation':
        return <Stethoscope className="w-4 h-4" />;
      case 'check-up':
        return <CheckCircle className="w-4 h-4" />;
      case 'emergency':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter(apt => {
    const now = new Date();
    const appointmentDate = new Date(apt.scheduledDate);
    
    if (filter === 'upcoming') {
      return appointmentDate >= now && apt.status === 'scheduled';
    } else if (filter === 'past') {
      return appointmentDate < now || apt.status !== 'scheduled';
    }
    return true; // 'all' filter
  });

  // Calculate counts for each filter type
  const counts = {
    all: appointments.length,
    upcoming: appointments.filter(apt => {
      const now = new Date();
      const appointmentDate = new Date(apt.scheduledDate);
      return appointmentDate >= now && apt.status === 'scheduled';
    }).length,
    past: appointments.filter(apt => {
      const now = new Date();
      const appointmentDate = new Date(apt.scheduledDate);
      return appointmentDate < now || apt.status !== 'scheduled';
    }).length
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
            <p className="text-gray-600">Manage appointments for {patient.fullName}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchAppointments}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            {/* Updated Schedule Appointment Button */}
            <button
              onClick={() => setIsSchedulerOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Appointment</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          {(['all', 'upcoming', 'past'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterType} ({counts[filterType]})
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchAppointments} className="text-red-700 hover:text-red-900">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'upcoming' 
                  ? 'No upcoming appointments scheduled.'
                  : filter === 'past'
                  ? 'No past appointments found.'
                  : 'No appointments found for this patient.'
                }
              </p>
              {/* Add call-to-action for scheduling first appointment */}
              {filter === 'upcoming' && (
                <button
                  onClick={() => setIsSchedulerOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule First Appointment</span>
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getTypeIcon(appointment.type)}
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {appointment.type.replace('-', ' ')}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(appointment.scheduledDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>Duration: {appointment.duration} minutes</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>Doctor: {appointment.doctorId.fullName}</span>
                        </div>
                        {appointment.doctorId.specialization && (
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="w-4 h-4 text-gray-400" />
                            <span>{appointment.doctorId.specialization}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Menu */}
                  <div className="flex space-x-2 ml-4">
                    {appointment.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel appointment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteAppointment(appointment._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete appointment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Appointment Scheduler Modal */}
      <AppointmentSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        patient={patient}
        onScheduleSuccess={handleScheduleSuccess}
      />
    </>
  );
};

export default AppointmentsView;