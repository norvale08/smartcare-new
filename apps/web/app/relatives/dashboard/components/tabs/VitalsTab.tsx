// relative/dashboard/components/tabs/VitalsTab.tsx
import { VitalRecord, PatientInfo } from '../../types';
import { DashboardUtils } from '../../utils';

interface VitalsTabProps {
  vitals: VitalRecord[];
  patientData: PatientInfo | null;
}

export function VitalsTab({ vitals, patientData }: VitalsTabProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg sm:text-xl font-medium text-gray-900">Health Records</h3>
        <p className="mt-1 text-sm sm:text-base text-gray-500">
          Recent health measurements for {patientData?.name || 'patient'}
        </p>
      </div>

      {/* Table or Empty State */}
      {vitals.length > 0 ? (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Date & Time', 'Type', 'BP (mmHg)', 'Heart Rate', 'Glucose', 'Status'].map((header) => (
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
                  <tr key={vital.id} className="hover:bg-gray-50">
                    {/* Date */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {DashboardUtils.formatDate(vital.timestamp)}
                    </td>

                    {/* Type */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full ${
                          vital.type === 'hypertension' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {vital.type}
                      </span>
                    </td>

                    {/* Blood Pressure */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic}` : 'N/A'}
                    </td>

                    {/* Heart Rate */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {vital.heartRate ? `${vital.heartRate} BPM` : 'N/A'}
                    </td>

                    {/* Glucose */}
                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                      {vital.glucose ? `${vital.glucose} mg/dL` : 'N/A'}
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
          <p className="text-gray-500 text-sm sm:text-base">No health records available yet</p>
        </div>
      )}
    </div>
  );
}
