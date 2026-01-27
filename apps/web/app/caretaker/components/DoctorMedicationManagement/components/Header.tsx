// FILE: app/caretaker/components/DoctorMedicationManagement/components/Header.tsx

import React from 'react';
import { Stethoscope, RefreshCw, FileText as FileTextIcon, Pill } from 'lucide-react';

interface HeaderProps {
  patient?: {
    id: string;
    fullName: string;
  };
  onExportReport: () => void;
  onRefresh: () => void;
  onPrescribeMedication: () => void;
  refreshing: boolean;
}

const Header: React.FC<HeaderProps> = ({
  patient,
  onExportReport,
  onRefresh,
  onPrescribeMedication,
  refreshing
}) => {
  return (
    <div className="p-6 border-b">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            <span>Medication Management</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {patient 
              ? `Managing medications for ${patient.fullName}` 
              : 'Overview of all patient medications'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Prescribe Medication Button - Only show when viewing a specific patient */}
          {patient && (
            <button
              onClick={onPrescribeMedication}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              title="Prescribe new medication"
            >
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">Prescribe Medication</span>
            </button>
          )}
          <button
            onClick={onExportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            title="Export side effects report"
          >
            <FileTextIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 border"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;