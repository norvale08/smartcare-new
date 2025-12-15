// FILE: apps/web/app/patient/components/AllergiesSection.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AllergiesSectionProps {
  allergies: any[];
  isEnglish: () => boolean;
}

const AllergiesSection: React.FC<AllergiesSectionProps> = ({ allergies, isEnglish }) => {
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-xs font-semibold text-red-700 mb-2 flex items-center">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {isEnglish() ? "Your Allergies:" : "Mzio Wako:"}
      </p>
      <div className="flex flex-wrap gap-2">
        {allergies.map((allergy, index) => {
          const allergyObj = typeof allergy === 'string' ? { allergyName: allergy, severity: 'mild', reaction: '' } : allergy;
          return (
            <div key={index} className="bg-white border border-red-300 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-900">{allergyObj.allergyName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded $${ allergyObj.severity === 'severe' ? 'bg-red-200 text-red-900' :
                  allergyObj.severity === 'moderate' ? 'bg-orange-200 text-orange-900' :
                  'bg-yellow-200 text-yellow-900'
                }`}>
                  {allergyObj.severity}
                </span>
              </div>
              {allergyObj.reaction && (
                <p className="text-xs text-red-700 mt-1">{allergyObj.reaction}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllergiesSection;