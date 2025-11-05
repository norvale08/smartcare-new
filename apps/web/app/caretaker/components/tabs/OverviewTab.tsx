// app/caretaker/components/tabs/OverviewTab.tsx
import React from 'react';
import { Patient, VitalSigns } from '../../types';
import CurrentVitals from '../CurrentVitals';
import HealthTrends from '../HealthTrends';
import QuickActions from '../QuickActions';
import AlertsPanel from '../AlertsPanel';

interface OverviewTabProps {
  patient: Patient;
  patientVitals: VitalSigns[];
  isLoading: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  patient,
  patientVitals,
  isLoading,
}) => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CurrentVitals 
          patient={patient}
          patientVitals={patientVitals}
          isLoading={isLoading}
        />
        
        <HealthTrends patientVitals={patientVitals} />
        
        <QuickActions patient={patient} />
        
        <AlertsPanel patient={patient} />
      </div>
    </div>
  );
};

export default OverviewTab;