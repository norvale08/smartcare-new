// relative/dashboard/components/HealthAlerts.tsx
import { AlertTriangle } from 'lucide-react';
import { HealthAlert } from '../types';
import { DashboardUtils } from '../utils';

interface HealthAlertsProps {
  alerts: HealthAlert[];
}

export function HealthAlerts({ alerts }: HealthAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`flex items-start p-4 rounded-lg border ${alert.severity === 'critical'
            ? 'bg-red-50 border-red-200'
            : alert.severity === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
            }`}
        >
          <AlertTriangle
            className={`w-5 h-5 mt-0.5 mr-3 ${alert.severity === 'critical'
              ? 'text-red-600'
              : alert.severity === 'warning'
                ? 'text-yellow-600'
                : 'text-blue-600'
              }`}
          />
          <div className="flex-1">
            <p
              className={`font-medium ${alert.severity === 'critical'
                ? 'text-red-900'
                : alert.severity === 'warning'
                  ? 'text-yellow-900'
                  : 'text-blue-900'
                }`}
            >
              {alert.message}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {DashboardUtils.formatDate(alert.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}