// relative/dashboard/components/HealthAlerts.tsx
import { AlertTriangle, X } from 'lucide-react';
import { HealthAlert } from '../types';
import { DashboardUtils } from '../utils';

interface HealthAlertsProps {
  alerts: HealthAlert[];
  onDismissAlert?: (alertId: string) => void;
}

export function HealthAlerts({ alerts, onDismissAlert }: HealthAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 sm:p-5 rounded-lg border transition-all duration-300
            ${alert.severity === 'critical'
              ? 'bg-red-50 border-red-200'
              : alert.severity === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
            }`}
        >
          {/* Icon */}
          <AlertTriangle
            className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5
              ${alert.severity === 'critical'
                ? 'text-red-600'
                : alert.severity === 'warning'
                ? 'text-yellow-600'
                : 'text-blue-600'
              }`}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <p
                  className={`text-sm sm:text-base font-medium leading-snug break-words
                    ${alert.severity === 'critical'
                      ? 'text-red-900'
                      : alert.severity === 'warning'
                      ? 'text-yellow-900'
                      : 'text-blue-900'
                    }`}
                >
                  {alert.message}
                </p>

                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {DashboardUtils.formatDate(alert.timestamp)}
                </p>
              </div>

              {/* Close Button */}
              {onDismissAlert && (
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-white/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  aria-label="Dismiss alert"
                  title="Mark as read"
                >
                  <X className={`w-4 h-4 sm:w-5 sm:h-5
                    ${alert.severity === 'critical'
                      ? 'text-red-600 hover:text-red-800'
                      : alert.severity === 'warning'
                      ? 'text-yellow-600 hover:text-yellow-800'
                      : 'text-blue-600 hover:text-blue-800'
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Alert Details */}
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${alert.severity === 'critical'
                    ? 'bg-red-200 text-red-800'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {alert.vital}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Value: {alert.value}
                  {alert.vital === 'Blood Pressure' ? ' mmHg' : 
                   alert.vital === 'Glucose' ? ' mg/dL' : 
                   alert.vital === 'Heart Rate' ? ' BPM' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dismiss All Button - Only show if there are multiple alerts */}
      {alerts.length > 1 && onDismissAlert && (
        <div className="flex justify-end">
          <button
            onClick={() => alerts.forEach(alert => onDismissAlert(alert.id))}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            Dismiss All
          </button>
        </div>
      )}
    </div>
  );
}