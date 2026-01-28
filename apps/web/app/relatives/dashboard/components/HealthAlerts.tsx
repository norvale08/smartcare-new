// relative/dashboard/components/HealthAlerts.tsx
import { AlertTriangle, X, Heart, Activity } from 'lucide-react';
import { HealthAlert } from '../types';
import { DashboardUtils } from '../utils';

interface HealthAlertsProps {
  alerts: HealthAlert[];
  onDismissAlert?: (alertId: string) => void;
}

export function HealthAlerts({ alerts, onDismissAlert }: HealthAlertsProps) {
  if (alerts.length === 0) return null;

  const getAlertIcon = (vital: string) => {
    if (vital === 'Hypertension') {
      return <Heart className="w-4 h-4 flex-shrink-0" />;
    } else if (vital === 'Diabetes') {
      return <Activity className="w-4 h-4 flex-shrink-0" />;
    }
    return <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
  };

  const getAlertColor = (severity: string) => {
    if (severity === 'critical') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800 border-red-300',
        icon: 'text-red-600',
        close: 'text-red-600 hover:bg-red-100'
      };
    } else if (severity === 'warning') {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-900',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: 'text-yellow-600',
        close: 'text-yellow-600 hover:bg-yellow-100'
      };
    } else {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: 'text-blue-600',
        close: 'text-blue-600 hover:bg-blue-100'
      };
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const colors = getAlertColor(alert.severity);
        
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${colors.bg} ${colors.border}`}
          >
            {/* Icon and Category Badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={colors.icon}>
                {getAlertIcon(alert.vital)}
              </div>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors.badge}`}>
                {alert.category || alert.vital}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Alert Message */}
                  <p className={`text-sm font-semibold ${colors.text} mb-1`}>
                    {alert.message}
                  </p>

                  {/* Recommendation */}
                  {alert.recommendation && (
                    <p className="text-xs text-gray-700 mb-1">
                      {alert.recommendation}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500">
                    {DashboardUtils.formatDate(alert.timestamp)}
                  </p>
                </div>

                {/* Close Button */}
                {onDismissAlert && (
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className={`flex-shrink-0 p-1 rounded transition-colors ${colors.close}`}
                    aria-label="Dismiss alert"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Dismiss All Button */}
      {alerts.length > 1 && onDismissAlert && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => alerts.forEach(alert => onDismissAlert(alert.id))}
            className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            Dismiss All
          </button>
        </div>
      )}
    </div>
  );
}