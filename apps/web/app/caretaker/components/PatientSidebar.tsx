// app/caretaker/components/PatientSidebar.tsx
import React from 'react';
import { Users, Search, Filter, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Patient } from '../types';
import PatientCard from './PatientCard';

interface PatientSidebarProps {
  patients: Patient[];
  searchTerm: string;
  filterCondition: "all" | "hypertension" | "diabetes" | "both";
  selectedPatient: Patient | null;
  onSearchChange: (term: string) => void;
  onFilterChange: (condition: "all" | "hypertension" | "diabetes" | "both") => void;
  onPatientSelect: (patient: Patient) => void;
  onSignInPatient: (patientId: string) => void;
  isLoading?: boolean;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patients,
  searchTerm,
  filterCondition,
  selectedPatient,
  onSearchChange,
  onFilterChange,
  onPatientSelect,
  onSignInPatient,
  isLoading = false,
}) => {
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = filterCondition === "all" || patient.condition === filterCondition;
    return matchesSearch && matchesCondition;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-4">
          <Users className="w-5 h-5" />
          <span>Assigned Patients</span>
          {isLoading && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Loading...
            </span>
          )}
        </h2>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex space-x-2">
            <select
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={filterCondition}
              onChange={(e) => onFilterChange(e.target.value as any)}
              disabled={isLoading}
            >
              <option value="all">All Conditions</option>
              <option value="hypertension">Hypertension</option>
              <option value="diabetes">Diabetes</option>
              <option value="both">Both</option>
            </select>
            <Filter className={`w-5 h-5 mt-2 ${isLoading ? 'text-gray-300' : 'text-gray-400'}`} />
          </div>
        </div>

        {/* Patient List */}
        <div className="space-y-2 max-h-96 overflow-y-auto mt-4">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border bg-white animate-pulse"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="ml-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mt-2">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPatients.length > 0 ? (
            // Real patient list - no mock data
            filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                isSelected={selectedPatient?.id === patient.id}
                onSelect={() => onPatientSelect(patient)}
                onSignIn={() => onSignInPatient(patient.id)}
              />
            ))
          ) : (
            // Empty state - shows real message based on actual data
            <div className="text-center text-gray-500 py-8">
              {patients.length === 0 ? (
                <div>
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-900 mb-1">No patients assigned yet</p>
                  <p className="text-sm">Patients will appear here when they request you and you accept them</p>
                </div>
              ) : (
                <div>
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-900 mb-1">No patients found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Patient Count - Only show if we have real patients */}
        {!isLoading && filteredPatients.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Showing {filteredPatients.length} of {patients.length} assigned patients
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSidebar;