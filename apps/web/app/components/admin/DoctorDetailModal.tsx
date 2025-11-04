import React from 'react';
import { Button } from '@repo/ui';
import { 
  X, 
  Mail, 
  Phone, 
  Building, 
  Stethoscope, 
  Calendar, 
  Edit, 
  Activity, 
  Heart,
  Key
} from 'lucide-react';
import { Doctor } from './DoctorsMangement';

interface DoctorDetailModalProps {
  doctor: Doctor;
  onClose: () => void;
  onEdit: () => void;
  onSendResetEmail: () => void;
  formatPhoneNumber: (phone: string | number) => string;
  getSpecializationDisplayName: (specialization: string) => string;
}

const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  doctor,
  onClose,
  onEdit,
  onSendResetEmail,
  formatPhoneNumber,
  getSpecializationDisplayName,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dr. {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-gray-600 mt-1">Doctor Details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{doctor.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">
                    {formatPhoneNumber(doctor.phoneNumber)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Registered Date</p>
                  <p className="text-gray-900">
                    {new Date(doctor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Stethoscope className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="text-gray-900">
                    {getSpecializationDisplayName(doctor.specialization)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Building className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Hospital</p>
                  <p className="text-gray-900">{doctor.hospital}</p>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">License Number</p>
                <code className="text-lg bg-white px-3 py-2 rounded border font-mono text-gray-900">
                  {doctor.licenseNumber}
                </code>
              </div>
            </div>
          </div>

          {/* Medical Conditions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Medical Conditions Treated
            </h3>
            <div className="flex flex-wrap gap-3">
              {doctor.diabetes && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <Activity size={16} />
                  <span className="font-medium">Diabetes</span>
                </div>
              )}
              {doctor.hypertension && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                  <Heart size={16} />
                  <span className="font-medium">Hypertension</span>
                </div>
              )}
              {!doctor.diabetes && !doctor.hypertension && (
                <p className="text-gray-500 italic">No specific conditions listed</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {doctor.conditions && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Information
              </h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{doctor.conditions}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Button
              onClick={onSendResetEmail}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Key size={16} className="mr-2" />
              Send Password Reset
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit size={16} className="mr-2" />
              Edit Doctor
            </Button>
            <Button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailModal;