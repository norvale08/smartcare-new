// FILE: apps/web/app/patient/components/ReportedSideEffectsSection.tsx
import React from 'react';
import { AlertCircle, UserCheck, CheckCircle } from 'lucide-react';

interface ReportedSideEffectsSectionProps {
  sideEffects: any[];
  isEnglish: () => boolean;
}

const ReportedSideEffectsSection: React.FC<ReportedSideEffectsSectionProps> = ({ sideEffects, isEnglish }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
      case 'very severe': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        {isEnglish() ? "Reported Side Effects:" : "Athari Zilizoripotiwa:"} ({sideEffects.length})
      </p>
      <div className="space-y-2">
        {sideEffects.map((effect, index) => (
          <div key={index} className="bg-white border border-orange-300 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{effect.sideEffectName}</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effect.severity)}`}>
                  {effect.severity}
                </span>
                {effect.intensity && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effect.intensity)}`}>
                    {effect.intensity}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(effect.reportedAt).toLocaleDateString()}
              </span>
            </div>
          
            {effect.notes && (
              <p className="text-xs text-gray-600 mt-1">{effect.notes}</p>
            )}
          
            {/* Doctor Information */}
            {effect.doctorNotes && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">
                    {isEnglish() ? 'Doctor Notes:' : 'Maelezo ya Daktari:'}
                  </span>
                </div>
                <p className="text-xs text-blue-700">{effect.doctorNotes}</p>
                {effect.resolved && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      {isEnglish() ? 'Resolved' : 'Imetatuliwa'}
                    </span>
                    {effect.resolvedAt && (
                      <span className="text-xs text-gray-500">
                        on {new Date(effect.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportedSideEffectsSection;