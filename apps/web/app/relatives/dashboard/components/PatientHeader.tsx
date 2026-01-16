// relative/dashboard/components/PatientHeader.tsx
import { User, Activity, Droplets, Thermometer, Heart, Calculator } from 'lucide-react';
import { PatientInfo, User as UserType } from '../types';
import { DashboardUtils } from '../utils';

interface PatientHeaderProps {
  patientData: PatientInfo | null;
  user: UserType;
  summary: any;
  bmiResult: number | null;
}

export function PatientHeader({ patientData, user, summary, bmiResult }: PatientHeaderProps) {
  const healthStatus = DashboardUtils.getHealthStatus(
    summary?.systolic,
    summary?.diastolic,
    summary?.glucose
  );
  const statusColor = DashboardUtils.getHealthStatusColor(healthStatus);
  const statusBgColor = DashboardUtils.getHealthStatusBgColor(healthStatus);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {patientData?.picture ? (
              <img
                src={patientData.picture}
                alt={patientData?.name || 'Patient'}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-2xl font-semibold">
                  {patientData?.name?.[0] || 'P'}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              {patientData?.name || 'Patient Name'}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <User className="w-3 h-3 mr-1" />
                {user.relationship || 'Family Member'}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBgColor} ${statusColor}`}>
                <Activity className="w-3 h-3 mr-1" />
                Status: {healthStatus}
              </span>
              {patientData?.diabetes && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Droplets className="w-3 h-3 mr-1" />
                  Diabetes
                </span>
              )}
              {patientData?.hypertension && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  <Thermometer className="w-3 h-3 mr-1" />
                  Hypertension
                </span>
              )}
              {patientData?.cardiovascular && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <Heart className="w-3 h-3 mr-1" />
                  Cardiovascular
                </span>
              )}
            </div>
          </div>
        </div>
        {/* BMI Indicator */}
        {bmiResult && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 rounded-xl">
            <div className="flex items-center mb-1">
              <Calculator className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-700">BMI</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{bmiResult}</span>
              <span className={`ml-2 text-sm font-medium ${DashboardUtils.getBMICategory(bmiResult).color}`}>
                {DashboardUtils.getBMICategory(bmiResult).category}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}