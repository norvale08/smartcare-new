// app/caretaker/components/tabs/OverviewTab.tsx
import React from 'react';
import { Patient, VitalSigns } from '../../types';
import CurrentVitals from '../CurrentVitals';
import HealthTrends from '../HealthTrends';
import TabbedQuickActions from '../TabbedQuickActions';
import AlertsPanel from '../AlertsPanel';
import VitalsPredictions from '../VitalsPredictions';

interface OverviewTabProps {
  patient: Patient;
  patientVitals: VitalSigns[];
  isLoading: boolean;
  onOpenMessaging: () => void;
  onPrescribeMedication: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  patient,
  patientVitals,
  isLoading,
  onOpenMessaging,
  onPrescribeMedication,
}) => {
  // Add age to each vital reading for predictions
  const predictionVitals = patientVitals.map(vital => ({
    ...vital,
    age: patient.age // Add patient's age to each vital
  }));

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CurrentVitals 
          patient={patient}
          patientVitals={patientVitals}
          isLoading={isLoading}
        />
        
        <HealthTrends patientVitals={patientVitals} />
        
        <VitalsPredictions 
          patient={{
            id: patient.id,
            fullName: patient.fullName,
            age: patient.age,
            condition: patient.condition
          }}
          vitals={predictionVitals} // Use the transformed vitals with age
        />
        
        <TabbedQuickActions 
          patient={patient}
          onOpenMessaging={onOpenMessaging}
          onPrescribeMedication={onPrescribeMedication}
        />
        
        <AlertsPanel patient={patient} />
      </div>
    </div>
  );
};

export default OverviewTab;