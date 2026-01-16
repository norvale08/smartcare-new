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
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Health Records</h3>
        <p className="mt-1 text-sm text-gray-500">
          Recent health measurements for {patientData?.name || 'patient'}
        </p>
      </div>

      {vitals.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BP (mmHg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heart Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Glucose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {DashboardUtils.formatDate(vital.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${vital.type === 'hypertension'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                        }`}>
                        {vital.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vital.heartRate ? `${vital.heartRate} BPM` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vital.glucose ? `${vital.glucose} mg/dL` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBgColor} ${statusColor}`}>
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
        <div className="text-center py-12">
          <p className="text-gray-500">No health records available yet</p>
        </div>
      )}
    </div>
  );
}