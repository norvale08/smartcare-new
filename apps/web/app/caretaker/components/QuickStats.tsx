// app/caretaker/components/QuickStats.tsx
import React from 'react';
import { Patient } from '../types';

interface QuickStatsProps {
  patients: Patient[];
  assignedCount?: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({ patients }) => {
  const today = new Date().toDateString();
  const signedInToday = patients.filter(p => 
    new Date(p.lastVisit).toDateString() === today
  ).length;
  
  const criticalPatients = patients.filter(p => p.status === "critical").length;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Today's Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Patients</span>
          <span className="font-medium">{patients.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Signed In</span>
          <span className="font-medium text-green-600">{signedInToday}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Needs Attention</span>
          <span className="font-medium text-red-600">{criticalPatients}</span>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;