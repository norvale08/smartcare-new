// relative/dashboard/components/HealthAlerts.tsx
import { AlertTriangle, X, Heart, Activity, AlertCircle } from 'lucide-react';
import { HealthAlert } from '../types';
import { DashboardUtils } from '../utils';

interface HealthAlertsProps {
  alerts: HealthAlert[];
  onDismissAlert?: (alertId: string) => void;
}

export function HealthAlerts({ alerts, onDismissAlert }: HealthAlertsProps) {
  if (alerts.length === 0) return null;

  const getAlertIcon = (vital: string, severity: string) => {
    const iconClass = `w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 ${
      severity === 'critical' ? 'text-red-600' : 
      severity === 'warning' ? 'text-yellow-600' : 
      'text-blue-600'
    }`;

    if (vital === 'Hypertension') {
      return <Heart className={iconClass} />;
    } else if (vital === 'Diabetes') {
      return <Activity className={iconClass} />;
    } else if (vital === 'Multiple Conditions') {
      return <AlertCircle className={iconClass} />;
    }
    return <AlertTriangle className={iconClass} />;
  };

  const getAlertColor = (severity: string) => {
    if (severity === 'critical') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-900',
        badge: 'bg-red-200 text-red-800',
        close: 'text-red-600 hover:text-red-800'
      };
    } else if (severity === 'warning') {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-900',
        badge: 'bg-yellow-200 text-yellow-800',
        close: 'text-yellow-600 hover:text-yellow-800'
      };
    } else {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-900',
        badge: 'bg-blue-200 text-blue-800',
        close: 'text-blue-600 hover:text-blue-800'
      };
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {alerts.map(alert => {
        const colors = getAlertColor(alert.severity);
        
        return (
          <div
            key={alert.id}
            className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 sm:p-5 rounded-lg border-2 transition-all duration-300 ${colors.bg} ${colors.border}`}
          >
            {/* Icon */}
            {getAlertIcon(alert.vital, alert.severity)}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  {/* Alert Category Badge */}
                  {alert.category && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                        {alert.category}
                      </span>
                    </div>
                  )}

                  {/* Alert Message */}
                  <p className={`text-sm sm:text-base font-semibold leading-snug break-words mb-2 ${colors.text}`}>
                    {alert.message}
                  </p>

                  {/* Recommendation */}
                  {alert.recommendation && (
                    <div className="mb-2 p-2 bg-white/50 rounded border border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Recommendation:</strong> {alert.recommendation}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs sm:text-sm text-gray-600">
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
                    <X className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.close}`} />
                  </button>
                )}
              </div>

              {/* Alert Details */}
              <div className="mt-3 pt-3 border-t border-gray-200/50">
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                    {alert.vital}
                  </span>
                  
                  {alert.value > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Value: {alert.value}
                      {alert.vital === 'Hypertension' ? ' mmHg (Systolic)' : 
                       alert.vital === 'Diabetes' ? ' mg/dL' : ''}
                    </span>
                  )}

                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    alert.severity === 'critical' ? 'bg-red-600 text-white' :
                    alert.severity === 'warning' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>

              {/* Critical Alert Actions */}
              {alert.severity === 'critical' && alert.vital === 'Multiple Conditions' && (
                <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-600 rounded">
                  <p className="text-xs sm:text-sm text-red-900 font-semibold">
                    ⚠️ URGENT: Patient requires immediate medical evaluation. Consider contacting their healthcare provider or emergency services.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Dismiss All Button - Only show if there are multiple alerts */}
      {alerts.length > 1 && onDismissAlert && (
        <div className="flex justify-end">
          <button
            onClick={() => alerts.forEach(alert => onDismissAlert(alert.id))}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Dismiss All Alerts
          </button>
        </div>
      )}
    </div>
  );
}