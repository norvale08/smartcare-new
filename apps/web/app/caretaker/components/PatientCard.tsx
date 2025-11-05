// app/caretaker/components/PatientCard.tsx
import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  isSelected: boolean;
  onSelect: () => void;
  onSignIn: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  isSelected,
  onSelect,
  onSignIn,
}) => {
  const getStatusIcon = (status: Patient["status"]) => {
    switch (status) {
      case "stable":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getConditionColor = (condition: Patient["condition"]) => {
    switch (condition) {
      case "hypertension":
        return "bg-blue-100 text-blue-800";
      case "diabetes":
        return "bg-orange-100 text-orange-800";
      case "both":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-50 border-blue-200"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
            {getStatusIcon(patient.status)}
          </div>
          <p className="text-sm text-gray-500">
            {patient.age}y • {patient.gender}
          </p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getConditionColor(patient.condition)}`}>
            {patient.condition}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSignIn();
          }}
          className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
      </div>
      <div className="flex items-center space-x-1 text-xs text-gray-400 mt-2">
        <Clock className="w-3 h-3" />
        <span>Last: {new Date(patient.lastVisit).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default PatientCard;