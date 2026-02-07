// relative/dashboard/components/tabs/VitalsTab.tsx
import { VitalRecord, PatientInfo } from '../../types';
import { DashboardUtils } from '../../utils';

interface VitalsTabProps {
  vitals: VitalRecord[];
  patientData: PatientInfo | null;
}

export function VitalsTab({ vitals, patientData }: VitalsTabProps) {
  // Function to determine the actual type based on what vitals are present
  const getVitalTypes = (vital: VitalRecord): {
    hasBloodPressure: boolean;
    hasGlucose: boolean;
    types: string[];
  } => {
    const hasBloodPressure = vital.systolic !== undefined && vital.diastolic !== undefined;
    const hasGlucose = vital.glucose !== undefined;
    const types: string[] = [];

    if (hasBloodPressure) types.push('Hypertension');
    if (hasGlucose) types.push('Diabetes');

    // Fallback to the type field if no specific vitals detected
    if (types.length === 0) {
      types.push(vital.type === 'diabetes' ? 'Diabetes' : 'Hypertension');
    }

    return { hasBloodPressure, hasGlucose, types };
  };

  // Function to render type badges
  const renderTypeBadges = (vital: VitalRecord) => {
    const { types } = getVitalTypes(vital);

    return (
      <div className="flex flex-wrap gap-1">
        {types.map((type) => {
          const badgeColor = type === 'Diabetes' 
            ? 'bg-orange-100 text-orange-800 border border-orange-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300';

          return (
            <span
              key={type}
              className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1 text-xs font-medium rounded-full ${badgeColor}`}
            >
              {type}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg sm:text-xl font-medium text-gray-900">Health Records</h3>
        <p className="mt-1 text-sm sm:text-base text-gray-500">
          Recent health measurements for {patientData?.name || 'patient'}
        </p>
        {patientData && (patientData.diabetes || patientData.hypertension) && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-600">
              Monitoring:
            </span>
            {patientData.hypertension && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                Hypertension
              </span>
            )}
            {patientData.diabetes && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                Diabetes
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table or Empty State */}
      {vitals.length > 0 ? (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Date & Time', 'Type', 'BP (mmHg)', 'Heart Rate', 'Glucose', 'Context', 'Status'].map((header) => (
                  <th
                    key={header}
                    className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {vitals.slice(0, 20).map((vital) => {
                const status = DashboardUtils.getHealthStatus(
                  vital.systolic,
                  vital.diastolic,
                  vital.glucose
                );
                const statusColor = DashboardUtils.getHealthStatusColor(status);
                const statusBgColor = DashboardUtils.getHealthStatusBgColor(status);

                return (
                  <tr key={vital.id} className="hover:bg-gray-50 transition-colors">
                    {/* Date */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {DashboardUtils.formatDate(vital.timestamp)}
                    </td>

                    {/* Type */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4">
                      {renderTypeBadges(vital)}
                    </td>

                    {/* Blood Pressure */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {vital.systolic && vital.diastolic ? (
                        <span className="font-medium">{vital.systolic}/{vital.diastolic}</span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Heart Rate */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {vital.heartRate ? (
                        <span className="font-medium">{vital.heartRate} <span className="text-xs text-gray-500">BPM</span></span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Glucose */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {vital.glucose ? (
                        <span className="font-medium">{vital.glucose} <span className="text-xs text-gray-500">mg/dL</span></span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Context (for glucose readings) */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      {vital.context ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {vital.context}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${statusBgColor} ${statusColor}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 px-4 sm:px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm sm:text-base font-medium">No health records available yet</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Vital signs will appear here once recorded</p>
        </div>
      )}
    </div>
  );
}