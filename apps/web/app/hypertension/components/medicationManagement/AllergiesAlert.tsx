// FILE: apps/web/app/patient/components/AllergiesAlert.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AllergiesAlertProps {
  allergies: string[];
  isEnglish: () => boolean;
}

const AllergiesAlert: React.FC<AllergiesAlertProps> = ({ allergies, isEnglish }) => {
  if (allergies.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-2">
            {isEnglish() ? "Your Allergies" : "Mzio Wako"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-white border border-red-200 text-red-800 rounded-lg text-sm font-medium flex items-center"
              >
                <AlertTriangle className="w-3 h-3 mr-2 text-red-600" />
                {allergy}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllergiesAlert;