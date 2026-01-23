// FILE: apps/web/app/patient/components/WeeklyCalendarTab.tsx
import React from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  PlayCircle,
  Trash2,
  FileText
} from 'lucide-react';
// import WeeklyCalendarTable from './WeeklyCalendarTable';
import CalendarLegend from '@/app/hypertension/components/medicationManagement/CalendarLegend';
import { WeeklyData } from '@/app/hypertension/types/medication-types';
import WeeklyCalendarTable from './WeeklyCalendarTable';
// Define the types here (or import from a shared types file)





interface WeeklyCalendarTabProps {
  weeklyData: WeeklyData | null;
  loading: boolean;
  currentWeekStart: Date;
  setCurrentWeekStart: (date: Date) => void;
  isEnglish: () => boolean;
  onRefresh: () => void;
  onMarkAsTaken: (medicationId: string, date?: string) => void;
  onMarkAsMissed: (medicationId: string, date?: string) => void;
  onStopMedication: (medicationId: string) => void;
  onRestartMedication: (medicationId: string) => void;
  onDeleteMedication: (medicationId: string) => void;
}

const WeeklyCalendarTab: React.FC<WeeklyCalendarTabProps> = ({
  weeklyData,
  loading,
  currentWeekStart,
  setCurrentWeekStart,
  isEnglish,
  onRefresh,
  onMarkAsTaken,
  onMarkAsMissed,
  onStopMedication,
  onRestartMedication,
  onDeleteMedication
}) => {
  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'missed':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'pending':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'stopped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
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

  const formatWeekRange = () => {
    if (!weeklyData || !weeklyData.weekStart || !weeklyData.weekEnd) return '';
    try {
      const start = new Date(weeklyData.weekStart);
      const end = new Date(weeklyData.weekEnd);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  if (loading && !weeklyData) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <div className="animate-pulse">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading medication calendar...</p>
        </div>
      </div>
    );
  }

  if (!weeklyData) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isEnglish() ? 'No Weekly Data Available' : 'Hakuna Data ya Wiki'}
        </h3>
        <p className="text-gray-500">
          {isEnglish() 
            ? "Unable to load weekly medication data. Please try refreshing or contact support if the issue persists." 
            : "Haikuweza kupakua data ya dawa za wiki. Tafadhali jaribu kupakia upya au wasiliana na msaada ikiwa tatizo linaendelea."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Header */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">
                {isEnglish() ? 'Weekly Medication Tracker' : 'Kufuatilia Dawa za Wiki'}
              </h3>
              <p className="text-sm text-gray-500">{formatWeekRange()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isEnglish() ? 'Previous week' : 'Wiki iliyopita'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
            >
              {isEnglish() ? 'Current Week' : 'Wiki ya Sasa'}
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isEnglish() ? 'Next week' : 'Wiki ijayo'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekly Summary */}
        {weeklyData.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 mb-1">
                {isEnglish() ? 'Active Medications' : 'Dawa Zinazotumika'}
              </p>
              <p className="text-xl font-bold text-blue-900">{weeklyData.summary.activeMedications}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 mb-1">
                {isEnglish() ? 'Taken This Week' : 'Zilizonywewa Wiki Hii'}
              </p>
              <p className="text-xl font-bold text-green-900">{weeklyData.summary.takenThisWeek}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 mb-1">
                {isEnglish() ? 'Missed This Week' : 'Zilizopitwa Wiki Hii'}
              </p>
              <p className="text-xl font-bold text-red-900">{weeklyData.summary.missedThisWeek}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700 mb-1">
                {isEnglish() ? 'Pending This Week' : 'Zinazongoza Wiki Hii'}
              </p>
              <p className="text-xl font-bold text-yellow-900">{weeklyData.summary.pendingThisWeek}</p>
            </div>
          </div>
        )}

        {/* Weekly Calendar Table */}
        <WeeklyCalendarTable
          weeklyData={weeklyData}
          isEnglish={isEnglish}
          onMarkAsTaken={onMarkAsTaken}
          onMarkAsMissed={onMarkAsMissed}
          onStopMedication={onStopMedication}
          onRestartMedication={onRestartMedication}
          onDeleteMedication={onDeleteMedication}
        />
      </div>

      {/* Legend */}
      <CalendarLegend isEnglish={isEnglish} />
    </div>
  );
};

export default WeeklyCalendarTab;