// FILE: app/caretaker/components/SideEffectUpdateModal.tsx
import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle, RefreshCw } from 'lucide-react';

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

interface SideEffectUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sideEffect: (SideEffect & { medicationId: string; effectIndex: number; medicationName: string }) | null;
  patientName: string;
  onUpdate: (updates: { resolved: boolean; doctorNotes: string }) => void;
}

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
                  sideEffect.severity === 'severe' ? 'bg-blue-100 text-blue-800' :
                  sideEffect.severity === 'moderate' ? 'bg-blue-50 text-blue-700' :
                  'bg-blue-25 text-blue-600'
                }`}>
                  {sideEffect.severity}
                </span>
                {sideEffect.intensity && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    sideEffect.intensity === 'very severe' ? 'bg-blue-100 text-blue-800' :
                    sideEffect.intensity === 'severe' ? 'bg-blue-100 text-blue-800' :
                    sideEffect.intensity === 'moderate' ? 'bg-blue-50 text-blue-700' :
                    'bg-blue-25 text-blue-600'
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

export default SideEffectUpdateModal;