import React from 'react';
import { Users, Stethoscope, HeartPulse, Activity, AlertTriangle } from 'lucide-react';
import { Patient } from '../types';

interface AssignedPatientsGridProps {
  patients: Patient[];
  onPatientSelect: (patient: Patient) => void;
  selectedPatient?: Patient | null;
}

const AssignedPatientsGrid: React.FC<AssignedPatientsGridProps> = ({
  patients,
  onPatientSelect,
  selectedPatient,
}) => {
  const getStatusIcon = (status: Patient["status"]) => {
    switch (status) {
      case "stable":
        return <AlertTriangle className="w-4 h-4 text-green-500" />;
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "diabetes":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "both":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConditionIcon = (condition: Patient["condition"]) => {
    switch (condition) {
      case "hypertension":
        return <HeartPulse className="w-4 h-4 text-blue-500" />;
      case "diabetes":
        return <Activity className="w-4 h-4 text-orange-500" />;
      case "both":
        return <div className="flex space-x-1">
          <HeartPulse className="w-4 h-4 text-blue-500" />
          <Activity className="w-4 h-4 text-orange-500" />
        </div>;
      default:
        return null;
    }
  };

  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Assigned</h3>
            <p className="text-gray-500">You don't have any patients assigned yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assigned Patients</h2>
            <p className="text-sm text-gray-500">{patients.length} patient(s)</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Click to view details
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              selectedPatient?.id === patient.id
                ? "bg-blue-50 border-blue-300 shadow-sm"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onPatientSelect(patient)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {patient.fullName}
                </h3>
                <p className="text-sm text-gray-500">
                  {patient.age}y • {patient.gender}
                </p>
              </div>
              {getStatusIcon(patient.status)}
            </div>

            <div className="flex items-center space-x-2 mb-3">
              {getConditionIcon(patient.condition)}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getConditionColor(patient.condition)}`}>
                {patient.condition}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Last visit:</span>
                <span className="font-medium text-gray-700">
                  {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Status:</span>
                <span className={`font-medium ${
                  patient.status === 'stable' ? 'text-green-600' :
                  patient.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedPatientsGrid;
