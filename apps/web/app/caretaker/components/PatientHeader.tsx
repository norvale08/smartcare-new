import React from 'react';
import { MessageSquare, User, MapPin } from 'lucide-react';
import { Patient } from '../types';

interface PatientHeaderProps {
  patient: Patient;
  onOpenMessaging: () => void;
  onViewLocation?: () => void; // Add optional location handler
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ 
  patient, 
  onOpenMessaging,
  onViewLocation 
}) => {
  const handleMessage = () => {
    onOpenMessaging();
  };

  const handleViewLocation = () => {
    if (onViewLocation) {
      onViewLocation();
    } else {
      // Fallback: Navigate to location page if no handler provided
      window.location.href = '/patient-location';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-emerald-100/60 p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          {/* Profile Picture Placeholder */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">{patient.fullName}</h2>
            <p className="text-gray-600">
              {patient.age} years • {patient.gender} • {patient.condition}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleViewLocation}
            className="flex items-center space-x-2 px-4 py-2 border border-green-300 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>View Location</span>
          </button>

          <button
            onClick={handleMessage}
            className="flex items-center space-x-2 px-4 py-2 border border-emerald-300 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;