// app/caretaker/components/PatientDetailView.tsx
import React, { useState } from 'react';
import { Patient, VitalSigns } from '../types';
import PatientHeader from './PatientHeader';
import NavigationTabs from './NavigationTabs';
import OverviewTab from './tabs/OverviewTab';
import VitalsTab from './tabs/VitalsTab';
import MessagesTab from './tabs/MessagesTab';

interface PatientDetailViewProps {
  selectedPatient: Patient | null;
  patientVitals: VitalSigns[];
  isLoading: boolean;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  selectedPatient,
  patientVitals,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "vitals" | "messages">("overview");

  if (!selectedPatient) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Patient Selected</h3>
          <p className="text-gray-500">
            Select a patient from the list to view their details and vitals
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PatientHeader patient={selectedPatient} />
      
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === "overview" && (
          <OverviewTab 
            patient={selectedPatient}
            patientVitals={patientVitals}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === "vitals" && (
          <VitalsTab patientVitals={patientVitals} />
        )}
        
        {activeTab === "messages" && (
          <MessagesTab patient={selectedPatient} />
        )}
      </div>
    </div>
  );
};

export default PatientDetailView;