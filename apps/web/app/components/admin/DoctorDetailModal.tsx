import React from 'react';
import { Button } from '@repo/ui';
import { Mail, Phone, Building, Stethoscope, X, Calendar, Heart, Activity, MapPin, Edit } from 'lucide-react';
import { Doctor } from './DoctorsMangement';

interface DoctorDetailModalProps {
  doctor: Doctor;
  onClose: () => void;
  onEdit: () => void;
  formatPhoneNumber: (phone: string | number) => string;
  getSpecializationDisplayName: (specialization: string) => string;
}

const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  doctor,
  onClose,
  onEdit,
  formatPhoneNumber,
  getSpecializationDisplayName,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Doctor Details</h2>
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
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="text-blue-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Dr. {doctor.firstName} {doctor.lastName}
            </h3>
            <p className="text-gray-600">{getSpecializationDisplayName(doctor.specialization)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Mail size={16} className="mr-3 text-gray-400" />
                    <span>{doctor.email}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Phone size={16} className="mr-3 text-gray-400" />
                    <span>{formatPhoneNumber(doctor.phoneNumber)}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Building size={16} className="mr-3 text-gray-400" />
                    <span>{doctor.hospital}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Professional Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Stethoscope size={16} className="mr-3 text-gray-400" />
                    <span>{getSpecializationDisplayName(doctor.specialization)}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin size={16} className="mr-3 text-gray-400" />
                    <span>License: {doctor.licenseNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Conditions Treated</h4>
                <div className="space-y-2">
                  {doctor.diabetes && (
                    <div className="flex items-center text-gray-700">
                      <Activity size={16} className="mr-3 text-green-500" />
                      <span>Diabetes Mellitus</span>
                    </div>
                  )}
                  {doctor.hypertension && (
                    <div className="flex items-center text-gray-700">
                      <Heart size={16} className="mr-3 text-red-500" />
                      <span>Hypertension</span>
                    </div>
                  )}
                  {!doctor.diabetes && !doctor.hypertension && (
                    <p className="text-gray-500 text-sm">No specific conditions listed</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                <div className="flex items-center text-gray-700">
                  <Calendar size={16} className="mr-3 text-gray-400" />
                  <span>Joined {new Date(doctor.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <Button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Close
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onEdit}
            >
              <Edit size={16} className="mr-2" />
              Edit Doctor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailModal;