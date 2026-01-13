// app/caretaker/components/AppointmentSchedulerModal.tsx
import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface AppointmentSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onScheduleSuccess?: () => void; // Optional callback for success
}

interface AppointmentFormData {
  type: 'follow-up' | 'consultation' | 'check-up' | 'emergency';
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  notes: string;
  reminder: boolean;
}

const AppointmentSchedulerModal: React.FC<AppointmentSchedulerModalProps> = ({
  isOpen,
  onClose,
  patient,
  onScheduleSuccess
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    type: 'follow-up',
    scheduledDate: '',
    scheduledTime: '',
    duration: '30',
    notes: '',
    reminder: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle scheduling appointment - now inside the modal
  const handleScheduleAppointment = async (appointmentData: any) => {
    try {
      console.log('📅 === SCHEDULING APPOINTMENT ===');
      console.log('👤 Patient:', patient);
      console.log('📋 Appointment Data:', appointmentData);

      const token = localStorage.getItem("token");
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Get current doctor ID
      const getCurrentDoctorId = (): string => {
        const userData = localStorage.getItem('user');
        console.log('👨‍⚕️ User data from localStorage:', userData);
        
        if (userData) {
          const user = JSON.parse(userData);
          const doctorId = user.id || user._id;
          console.log('👨‍⚕️ Doctor ID:', doctorId);
          return doctorId;
        }
        
        // Try to get from session storage as fallback
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
          const user = JSON.parse(sessionUser);
          const doctorId = user.id || user._id;
          console.log('👨‍⚕️ Doctor ID from session:', doctorId);
          return doctorId;
        }
        
        throw new Error("Could not find doctor ID. Please make sure you're logged in.");
      };

      const doctorId = getCurrentDoctorId();
      
      // Prepare the request data
      const requestData = {
        patientId: patient.id,
        doctorId: doctorId,
        type: appointmentData.type,
        scheduledDate: `${appointmentData.scheduledDate}T${appointmentData.scheduledTime}:00`,
        duration: parseInt(appointmentData.duration),
        notes: appointmentData.notes,
        status: 'scheduled'
      };

      console.log('📤 Request Data:', requestData);
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/appointments`;
      console.log('🌐 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        console.error('❌ HTTP Error:', errorText);
        
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('📦 Response Data:', result);

      if (result.success) {
        console.log('✅ Appointment scheduled successfully!');
        return result;
      } else {
        console.error('❌ Failed to schedule appointment:', result.message);
        throw new Error(result.message || 'Failed to schedule appointment');
      }
    } catch (error: any) {
      console.error('💥 Error scheduling appointment:', error);
      throw error; // Re-throw to handle in the form submission
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    try {
      setIsSubmitting(true);
      
      console.log('📝 Form data before submission:', formData);
      
      // Validate form data
      if (!formData.scheduledDate || !formData.scheduledTime) {
        throw new Error('Please select both date and time');
      }

      // Validate that the selected date is not in the past
      const selectedDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const now = new Date();
      if (selectedDateTime < now) {
        throw new Error('Please select a future date and time');
      }

      const appointmentData = {
        type: formData.type,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        duration: formData.duration,
        notes: formData.notes,
        reminder: formData.reminder
      };
      
      console.log('🚀 Sending appointment data:', appointmentData);
      
      // Call the scheduling function
      const result = await handleScheduleAppointment(appointmentData);
      
      // Success handling
      setSuccess(true);
      console.log('🎉 Appointment created:', result.appointment);
      
      // Reset form on success
      setFormData({
        type: 'follow-up',
        scheduledDate: '',
        scheduledTime: '',
        duration: '30',
        notes: '',
        reminder: true
      });
      
      // Call success callback if provided
      if (onScheduleSuccess) {
        onScheduleSuccess();
      }
      
      // Close modal after a brief success display
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error in form submission:', error);
      setError(error.message || 'Failed to schedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user makes changes
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  // Generate time slots
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Schedule Follow-up</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm">✅ Appointment scheduled successfully!</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={isSubmitting}
            >
              <option value="follow-up">Follow-up Visit</option>
              <option value="consultation">Consultation</option>
              <option value="check-up">Routine Check-up</option>
              <option value="emergency">Emergency Visit</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <select
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Select time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes) *
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={isSubmitting}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Reason for appointment, specific concerns..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="reminder"
              checked={formData.reminder}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              disabled={isSubmitting}
            />
            <label className="ml-2 text-sm text-gray-700">
              Send reminder notification
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                'Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentSchedulerModal;