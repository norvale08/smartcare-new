// FILE: apps/web/app/patient/components/DayCell.tsx
import React from 'react';
import { CheckCircle, Clock, XCircle, Pause } from 'lucide-react';

interface DayCellProps {
  day: any;
  status: string;
  takenTime: string | null;
  isActive: boolean;
  medicationId: string;
  dayDate: string;
  onMarkAsTaken: (medicationId: string, date?: string) => void;
  onShowMissDialog: () => void;
  isEnglish: () => boolean;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  status,
  takenTime,
  isActive,
  medicationId,
  dayDate,
  onMarkAsTaken,
  onShowMissDialog,
  isEnglish
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'stopped': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'stopped': return <Pause className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`p-2 rounded-lg border ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
      </div>
      {takenTime && (
        <span className="text-xs mt-1 text-gray-600">{takenTime}</span>
      )}
      {day.isToday && isActive && status === 'pending' && (
        <div className="mt-2 space-y-1">
          <button
            onClick={() => onMarkAsTaken(medicationId, dayDate)}
            className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors w-full"
          >
            {isEnglish() ? 'Taken' : 'Imenywewa'}
          </button>
          <button
            onClick={onShowMissDialog}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors w-full"
          >
            {isEnglish() ? 'Missed' : 'Imepitwa'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DayCell;