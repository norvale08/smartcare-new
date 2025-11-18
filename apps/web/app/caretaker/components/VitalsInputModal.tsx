// app/caretaker/components/VitalsInputModal.tsx
import React, { useState } from 'react';
import { X, Heart, Activity } from 'lucide-react';

interface VitalsInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onSave: (vitalsData: any) => void;
}

const VitalsInputModal: React.FC<VitalsInputModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave
}) => {
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    glucose: '',
    context: 'random',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data based on patient condition
    const vitalsData: any = {
      context: formData.context,
      notes: formData.notes
    };

    if (patient.condition === 'hypertension' || patient.condition === 'both') {
      if (formData.systolic && formData.diastolic && formData.heartRate) {
        vitalsData.systolic = Number(formData.systolic);
        vitalsData.diastolic = Number(formData.diastolic);
        vitalsData.heartRate = Number(formData.heartRate);
      }
    }

    if (patient.condition === 'diabetes' || patient.condition === 'both') {
      if (formData.glucose) {
        vitalsData.glucose = Number(formData.glucose);
      }
    }

    onSave(vitalsData);
    onClose();
    
    // Reset form
    setFormData({
      systolic: '',
      diastolic: '',
      heartRate: '',
      glucose: '',
      context: 'random',
      notes: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold">Add Vitals Manually</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Blood Pressure Section */}
          {(patient.condition === 'hypertension' || patient.condition === 'both') && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Blood Pressure</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    name="systolic"
                    value={formData.systolic}
                    onChange={handleChange}
                    min="50"
                    max="250"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    name="diastolic"
                    value={formData.diastolic}
                    onChange={handleChange}
                    min="30"
                    max="150"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="80"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  name="heartRate"
                  value={formData.heartRate}
                  onChange={handleChange}
                  min="30"
                  max="200"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="72"
                />
              </div>
            </div>
          )}

          {/* Glucose Section */}
          {(patient.condition === 'diabetes' || patient.condition === 'both') && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Glucose Level</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  name="glucose"
                  value={formData.glucose}
                  onChange={handleChange}
                  min="50"
                  max="500"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="120"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Measurement Context
            </label>
            <select
              name="context"
              value={formData.context}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="random">Random</option>
              <option value="fasting">Fasting</option>
              <option value="post-meal">Post-Meal</option>
              <option value="before-bed">Before Bed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Additional context about this reading..."
            />
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
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Save Vitals
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VitalsInputModal;