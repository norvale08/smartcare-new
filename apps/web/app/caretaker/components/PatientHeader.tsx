// app/caretaker/components/PatientHeader.tsx
import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { Patient } from '../types';

interface PatientHeaderProps {
  patient: Patient;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ patient }) => {
  const handleCall = () => {
    if (patient.phoneNumber) {
      window.open(`tel:${patient.phoneNumber}`, '_self');
    }
  };

  const handleMessage = () => {
    // Implement messaging logic
    console.log('Open messaging for:', patient.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{patient.fullName}</h2>
          <p className="text-gray-600">
            {patient.age} years • {patient.gender} • {patient.condition}
          </p>
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
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;