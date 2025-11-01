import React from 'react';
import { Button } from '@repo/ui';
import { Mail, Phone, Building, Stethoscope, Calendar, Eye, Edit, Trash2, Activity, Heart, Users } from 'lucide-react';
import { Doctor } from './DoctorsMangement';

interface DoctorsTableProps {
  doctors: Doctor[];
  onViewDoctor: (doctor: Doctor) => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (doctorId: string) => void;
  formatPhoneNumber: (phone: string | number) => string;
  getSpecializationDisplayName: (specialization: string) => string;
}

const DoctorsTable: React.FC<DoctorsTableProps> = ({
  doctors,
  onViewDoctor,
  onEditDoctor,
  onDeleteDoctor,
  formatPhoneNumber,
  getSpecializationDisplayName,
}) => {
  const getConditionCount = (doctor: Doctor): number => {
    let count = 0;
    if (doctor.diabetes) count++;
    if (doctor.hypertension) count++;
    return count;
  };

  // Enhanced phone number formatting that handles various input types
  const safeFormatPhoneNumber = (phone: string | number | undefined | null): string => {
    if (!phone) return 'N/A';
    
    try {
      // Convert to string and remove any non-digit characters
      const phoneStr = phone.toString().replace(/\D/g, '');
      
      // Format as (XXX) XXX-XXXX if it's 10 digits
      if (phoneStr.length === 10) {
        return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
      }
      
      // Return original if it doesn't match expected format
      return phoneStr || 'N/A';
    } catch (error) {
      console.error('Error formatting phone number:', error, phone);
      return 'Invalid';
    }
  };

  // Debug: Check what data we're receiving
  console.log('Doctors data in table:', doctors);
  doctors.forEach((doctor: Doctor) => {
    console.log(`Doctor ${doctor.firstName} phone:`, {
      raw: doctor.phoneNumber,
      type: typeof doctor.phoneNumber,
      formatted: safeFormatPhoneNumber(doctor.phoneNumber)
    });
  });

  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
          <p className="mt-2 text-gray-500">
            No doctors match your search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Specialization</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hospital</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Conditions</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">License</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {doctors.map((doctor: Doctor) => (
              <tr key={doctor._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      <Calendar size={12} className="inline mr-1" />
                      Joined {new Date(doctor.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail size={14} className="mr-2 text-gray-400" />
                      {doctor.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone size={14} className="mr-2 text-gray-400" />
                      {/* Use the safe formatting function */}
                      {safeFormatPhoneNumber(doctor.phoneNumber)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Stethoscope size={14} className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {getSpecializationDisplayName(doctor.specialization)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <Building size={14} className="mr-2 text-gray-400" />
                    {doctor.hospital || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {doctor.diabetes && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Activity size={12} className="mr-1" />
                        Diabetes
                      </span>
                    )}
                    {doctor.hypertension && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Heart size={12} className="mr-1" />
                        Hypertension
                      </span>
                    )}
                    {getConditionCount(doctor) === 0 && (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                    {doctor.licenseNumber || 'N/A'}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => onViewDoctor(doctor)}
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                      onClick={() => onEditDoctor(doctor)}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => onDeleteDoctor(doctor._id)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorsTable;