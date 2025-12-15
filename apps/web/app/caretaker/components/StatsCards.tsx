// FILE: app/caretaker/components/StatsCards.tsx
import React from 'react';
import { Pill, AlertCircle, AlertTriangle, User } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalMedications: number;
    active: number;
    stopped: number;
    completed: number;
    totalSideEffects: number;
    severeSideEffects: number;
    unresolvedSideEffects: number;
  };
  patientCount: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, patientCount }) => {
  return (
    <div className="p-6 border-b">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Total Medications</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalMedications}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${stats.active > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {stats.active} active
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${stats.stopped > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-800'}`}>
              {stats.stopped} stopped
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${stats.completed > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {stats.completed} completed
            </span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Total Side Effects</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalSideEffects}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${stats.severeSideEffects > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {stats.severeSideEffects} severe
            </span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Unresolved Issues</p>
              <p className="text-2xl font-bold text-blue-900">{stats.unresolvedSideEffects}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 font-medium">Requires attention</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Patients</p>
              <p className="text-2xl font-bold text-gray-900">{patientCount}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">With medications</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;