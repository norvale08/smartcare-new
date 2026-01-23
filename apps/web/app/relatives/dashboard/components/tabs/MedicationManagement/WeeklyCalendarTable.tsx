// FILE: apps/web/app/patient/components/WeeklyCalendarTable.tsx
import React, { useState } from 'react';
import { 
  Pause,
  PlayCircle,
  Trash2,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  XCircle
} from 'lucide-react';
import MedicationInfoCard from '@/app/hypertension/components/medicationManagement/MedicationInfoCard';
import DayCell from '@/app/hypertension/components/medicationManagement/DayCell';
import MedicationActions from '@/app/hypertension/components/medicationManagement/MedicationActions';
import EmptyMedicationsState from './EmptyMedicationsState';

// Define proper types
interface WeekDay {
  name: string;
  date: string;
  formatted: string;
  isToday: boolean;
  isPast: boolean;
}

interface WeeklyMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  status: string;
  patientAllergies: Array<any>;
  experiencedSideEffects: Array<any>;
  weeklyData: {
    [date: string]: {
      taken: boolean;
      status: 'pending' | 'taken' | 'missed' | 'stopped';
      takenTime: string | null;
      isToday: boolean;
      isPast: boolean;
    };
  };
  prescribedBy?: {
    fullName: string;
    specialization?: string;
  };
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  weekDays: WeekDay[];
  medications: WeeklyMedication[];
  summary: {
    totalMedications: number;
    activeMedications: number;
    takenThisWeek: number;
    missedThisWeek: number;
    pendingThisWeek: number;
  };
}

interface WeeklyCalendarTableProps {
  weeklyData: WeeklyData | null;
  isEnglish: () => boolean;
  onMarkAsTaken: (medicationId: string, date?: string) => void;
  onMarkAsMissed: (medicationId: string, date?: string) => void;
  onStopMedication: (medicationId: string) => void;
  onRestartMedication: (medicationId: string) => void;
  onDeleteMedication: (medicationId: string) => void;
}

const WeeklyCalendarTable: React.FC<WeeklyCalendarTableProps> = ({
  weeklyData,
  isEnglish,
  onMarkAsTaken,
  onMarkAsMissed,
  onStopMedication,
  onRestartMedication,
  onDeleteMedication
}) => {
  const [showMissDialog, setShowMissDialog] = useState<{ [key: string]: boolean }>({});
  const [showStopDialog, setShowStopDialog] = useState<{ [key: string]: boolean }>({});
  const [missReasons, setMissReasons] = useState<{ [key: string]: string }>({});
  const [stopReasons, setStopReasons] = useState<{ [key: string]: string }>({});
  const [stopNotes, setStopNotes] = useState<{ [key: string]: string }>({});

  // Helper functions
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

  if (!weeklyData || !weeklyData.weekDays || weeklyData.weekDays.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isEnglish() ? 'No Calendar Data' : 'Hakuna Data ya Kalenda'}
        </h3>
        <p className="text-gray-500">
          {isEnglish() 
            ? "Unable to generate calendar. Please try refreshing." 
            : "Haikuweza kuzalisha kalenda. Tafadhali jaribu kupakia upya."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-3 bg-gray-50 border-b font-medium text-gray-700 sticky left-0 z-10 min-w-[200px]">
              {isEnglish() ? 'Medication' : 'Dawa'}
            </th>
            {weeklyData.weekDays.map((day: WeekDay) => (
              <th key={day.date} className="text-center p-3 bg-gray-50 border-b min-w-[100px]">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">{day.name.slice(0, 3)}</span>
                  <span className={`text-xs ${day.isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                    {day.date.split('-')[2]}
                  </span>
                  {day.isToday && (
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>
                  )}
                </div>
              </th>
            ))}
            <th className="text-center p-3 bg-gray-50 border-b font-medium text-gray-700 min-w-[100px]">
              {isEnglish() ? 'Actions' : 'Vitendo'}
            </th>
          </tr>
        </thead>
        <tbody>
          {weeklyData.medications && weeklyData.medications.length > 0 ? (
            weeklyData.medications.map((medication: WeeklyMedication) => {
              const today = new Date().toISOString().split('T')[0];
              const isActive = medication.status === 'active';
              
              return (
                <tr key={medication.medicationId} className="border-b hover:bg-gray-50">
                  <td className="p-3 sticky left-0 bg-white z-10">
                    <MedicationInfoCard 
                      medication={medication}
                      isEnglish={isEnglish}
                    />
                  </td>
                  {weeklyData.weekDays.map((day: WeekDay) => {
                    const dayData = medication.weeklyData?.[day.date];
                    const status = dayData?.status || (day.isPast && isActive ? 'missed' : 'pending');
                    const taken = dayData?.taken || false;
                    const takenTime = dayData?.takenTime || null;
                    
                    return (
                      <td key={`${medication.medicationId}-${day.date}`} className="text-center p-3">
                        <DayCell 
                          day={day}
                          status={status}
                          takenTime={takenTime}
                          isActive={isActive}
                          medicationId={medication.medicationId}
                          dayDate={day.date}
                          onMarkAsTaken={onMarkAsTaken}
                          onShowMissDialog={() => setShowMissDialog(prev => ({ ...prev, [medication.medicationId]: true }))}
                          isEnglish={isEnglish}
                        />
                      </td>
                    );
                  })}
                  <td className="p-3">
                    <MedicationActions 
                      medication={medication}
                      onStopMedication={onStopMedication}
                      onRestartMedication={onRestartMedication}
                      onDeleteMedication={onDeleteMedication}
                      onShowStopDialog={() => setShowStopDialog(prev => ({ ...prev, [medication.medicationId]: true }))}
                      isEnglish={isEnglish}
                    />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={weeklyData.weekDays.length + 2} className="text-center p-8">
                <EmptyMedicationsState isEnglish={isEnglish} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyCalendarTable;