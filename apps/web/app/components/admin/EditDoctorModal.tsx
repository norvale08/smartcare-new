import React, { useState } from 'react';
import { Button } from '@repo/ui';
import { Stethoscope, X, ArrowLeft, Save, Activity, Heart } from 'lucide-react';
import { Doctor } from './DoctorsMangement';

interface EditDoctorModalProps {
  doctor: Doctor;
  onClose: () => void;
  onSave: (doctorId: string, updatedData: any) => Promise<boolean>;
  getSpecializationDisplayName: (specialization: string) => string;
}

const EditDoctorModal: React.FC<EditDoctorModalProps> = ({
  doctor,
  onClose,
  onSave,
  getSpecializationDisplayName,
}) => {
  const [editForm, setEditForm] = useState({
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    email: doctor.email,
    phoneNumber: doctor.phoneNumber,
    specialization: doctor.specialization,
    licenseNumber: doctor.licenseNumber,
    hospital: doctor.hospital,
    treatsDiabetes: doctor.diabetes,
    treatsHypertension: doctor.hypertension
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(doctor._id, editForm);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-white">Edit Doctor</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Dr. {doctor.firstName} {doctor.lastName}
            </h3>
            <p className="text-gray-600">Update doctor information</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization *
                </label>
                <select
                  required
                  value={editForm.specialization}
                  onChange={(e) => setEditForm({...editForm, specialization: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Specialization</option>
                  <option value="general-practice">General Practice</option>
                  <option value="endocrinology">Endocrinology</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="nephrology">Nephrology</option>
                  <option value="internal-medicine">Internal Medicine</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.licenseNumber}
                  onChange={(e) => setEditForm({...editForm, licenseNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.hospital}
                  onChange={(e) => setEditForm({...editForm, hospital: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Conditions Treated
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.treatsDiabetes}
                      onChange={(e) => setEditForm({...editForm, treatsDiabetes: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Activity size={16} className="ml-2 mr-2 text-green-500" />
                    <span className="text-gray-700">Diabetes Mellitus</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.treatsHypertension}
                      onChange={(e) => setEditForm({...editForm, treatsHypertension: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Heart size={16} className="ml-2 mr-2 text-red-500" />
                    <span className="text-gray-700">Hypertension</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDoctorModal;