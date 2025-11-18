// app/caretaker/components/tabs/VitalsTab.tsx
import React from 'react';
import { VitalSigns } from '../../types';
import HealthTrends from '../HealthTrends';

interface VitalsTabProps {
  patientVitals: VitalSigns[];
}

const VitalsTab: React.FC<VitalsTabProps> = ({ patientVitals }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Vitals History</h3>
      <HealthTrends patientVitals={patientVitals} showDetailed />
    </div>
  );
};

export default VitalsTab;