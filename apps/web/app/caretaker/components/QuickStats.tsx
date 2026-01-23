// app/caretaker/components/QuickStats.tsx
import React from 'react';
import { Patient } from '../types';
import { HeartPulse, Activity, AlertTriangle, CheckCircle, Users } from 'lucide-react';

interface QuickStatsProps {
  patients: Patient[];
  assignedCount?: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({ patients }) => {
  // Calculate today's date for comparison
  const today = new Date().toDateString();

  // Calculate various statistics
  const signedInToday = patients.filter(p =>
    new Date(p.lastVisit).toDateString() === today
  ).length;

  const criticalPatients = patients.filter(p => p.status === "critical").length;
  const warningPatients = patients.filter(p => p.status === "warning").length;
  const stablePatients = patients.filter(p => p.status === "stable").length;

  // Calculate condition-based statistics
  const hypertensionPatients = patients.filter(p => p.condition === "hypertension").length;
  const diabetesPatients = patients.filter(p => p.condition === "diabetes").length;
  const bothConditionsPatients = patients.filter(p => p.condition === "both").length;

  // Calculate percentage of patients who need attention
  const totalNeedsAttention = criticalPatients + warningPatients;
  const attentionPercentage = patients.length > 0
    ? Math.round((totalNeedsAttention / patients.length) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          Dashboard Summary
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {patients.length} patients
        </span>
      </div>

      <div className="space-y-3">
        {/* Total Patients */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Total Patients
          </span>
          <span className="font-medium text-gray-900">{patients.length}</span>
        </div>

        {/* Activity Stats */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Signed In Today
          </span>
          <span className="font-medium text-green-600">{signedInToday}</span>
        </div>

        {/* Status Stats */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Needs Attention
          </span>
          <span className="font-medium text-red-600">{totalNeedsAttention}</span>
        </div>

        {/* Breakdown by condition */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            By Condition
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-blue-600">
                <HeartPulse className="w-3 h-3" />
                Hypertension
              </span>
              <span className="font-medium">{hypertensionPatients}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-orange-600">
                <Activity className="w-3 h-3" />
                Diabetes
              </span>
              <span className="font-medium">{diabetesPatients}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-purple-600">
                <span className="flex gap-0.5">
                  <HeartPulse className="w-3 h-3" />
                  <Activity className="w-3 h-3" />
                </span>
                Both
              </span>
              <span className="font-medium">{bothConditionsPatients}</span>
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="border-t border-gray-100 pt-3 mt-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-emerald-600" />
            Status Overview
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                Stable
              </span>
              <span className="font-medium">{stablePatients}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-3 h-3" />
                Warning
              </span>
              <span className="font-medium">{warningPatients}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-3 h-3" />
                Critical
              </span>
              <span className="font-medium">{criticalPatients}</span>
            </div>
          </div>
        </div>

        {/* Attention percentage indicator */}
        {patients.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Attention Required</span>
              <span className="font-medium text-sm">{attentionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full ${attentionPercentage > 30 ? 'bg-red-500' : attentionPercentage > 10 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${attentionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickStats;
