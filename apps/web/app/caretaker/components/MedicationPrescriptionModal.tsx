// app/components/MedicationPrescriptionModal.tsx
import React, { useState } from 'react';
import { X, Pill, Calendar, Clock, AlertCircle } from 'lucide-react';

interface MedicationPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onPrescribe: (prescription: any) => void;
}

const MedicationPrescriptionModal: React.FC<MedicationPrescriptionModalProps> = ({
  isOpen,
  onClose,
  patient,
  onPrescribe
}) => {
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    reminders: [] as string[]
  });

  const reminderTimes = ['08:00', '12:00', '18:00', '20:00'];

  const handleToggleReminder = (time: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.includes(time)
        ? prev.reminders.filter(t => t !== time)
        : [...prev.reminders, time]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPrescribe({
      ...formData,
      patientId: patient.id,
      prescribedAt: new Date().toISOString(),
      status: 'active'
    });
    onClose();
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      startDate: new Date().toISOString().split('T')[0],
      reminders: []
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Prescribe Medication</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication Name *
            </label>
            <input
              type="text"
              required
              value={formData.medicationName}
              onChange={(e) => setFormData(prev => ({ ...prev, medicationName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Lisinopril 10mg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage *
              </label>
              <input
                type="text"
                required
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1 tablet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <select
                required
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select frequency</option>
                <option value="once daily">Once daily</option>
                <option value="twice daily">Twice daily</option>
                <option value="three times daily">Three times daily</option>
                <option value="as needed">As needed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration *
            </label>
            <input
              type="text"
              required
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 30 days"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Special instructions for the patient..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Times
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reminderTimes.map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleToggleReminder(time)}
                  className={`flex items-center space-x-2 p-2 rounded-lg border text-sm ${
                    formData.reminders.includes(time)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Prescribe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicationPrescriptionModal;