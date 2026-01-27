// FILE: app/caretaker/components/DoctorMedicationManagement/components/LoadingState.tsx

import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-12 bg-gray-200 rounded w-full"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingState;