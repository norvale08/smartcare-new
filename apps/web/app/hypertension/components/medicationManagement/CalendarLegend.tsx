// FILE: apps/web/app/patient/components/CalendarLegend.tsx
import React from 'react';

interface CalendarLegendProps {
  isEnglish: () => boolean;
}

const CalendarLegend: React.FC<CalendarLegendProps> = ({ isEnglish }) => {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="font-medium text-gray-700 mb-3">
        {isEnglish() ? 'Status Legend' : 'Maelezo ya Hali'}
      </h4>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
          <span className="text-sm">{isEnglish() ? 'Taken' : 'Imenywewa'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
          <span className="text-sm">{isEnglish() ? 'Missed' : 'Imepitwa'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
          <span className="text-sm">{isEnglish() ? 'Pending' : 'Inangojea'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
          <span className="text-sm">{isEnglish() ? 'Stopped' : 'Imeachwa'}</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarLegend;