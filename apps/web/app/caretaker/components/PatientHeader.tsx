import React from 'react';
import { Phone, MessageSquare, Camera, User } from 'lucide-react';
import { Patient } from '../types';

interface PatientHeaderProps {
  patient: Patient;
   onOpenMessaging: () => void; 
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ patient, onOpenMessaging }) => {
  const handleCall = () => {
    if (patient.phoneNumber) {
      window.open(`tel:${patient.phoneNumber}`, '_self');
    }
  };

  const handleMessage = () => {
    onOpenMessaging(); // Just call the function without parameters
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          {/* Profile Picture Placeholder */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
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
            onClick={handleMessage}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>
          <button
            onClick={handleCall}
            disabled={!patient.phoneNumber}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              patient.phoneNumber
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {/* <Phone className="w-4 h-4" />
            <span>Call</span> */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
