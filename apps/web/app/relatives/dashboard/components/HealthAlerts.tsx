// relatives/dashboard/components/HealthAlerts.tsx
import { useState, useEffect } from 'react';
import { AlertTriangle, X, Heart, Activity, Clock } from 'lucide-react';
import { HealthAlert } from '../types';
import { DashboardUtils } from '../utils';

interface HealthAlertsProps {
  alerts: HealthAlert[];
  onDismissAlert?: (alertId: string) => void;
  patientId?: string;  // NOTE: This should be the patient's USER ID, not profile ID
  dismissedAlertIds?: Set<string>;
}

export function HealthAlerts({ alerts: propAlerts, onDismissAlert, patientId, dismissedAlertIds = new Set() }: HealthAlertsProps) {
  const [apiAlerts, setApiAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch health alerts from notifications API
  useEffect(() => {
    const fetchHealthAlerts = async () => {
      if (!patientId) {
        console.log('HealthAlerts: No patientId provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('HealthAlerts: No authentication token found');
          setLoading(false);
          return;
        }

        console.log('HealthAlerts: Fetching notifications for patient USER ID:', patientId);
        console.log('HealthAlerts: PatientId length check:', patientId.length);

        // Use the relative-specific endpoint
        // CRITICAL: This endpoint expects the patient's USER ID, not the patient profile ID
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/relative/${patientId}?limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('HealthAlerts: Response status:', response.status);

        if (!response.ok) {
          if (response.status === 404) {
            console.log('HealthAlerts: No notifications found (404)');
            setApiAlerts([]);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }

        const result = await response.json();
        console.log('HealthAlerts: Raw API response:', result);

        if (result.success && result.data) {
          console.log('HealthAlerts: Total notifications received:', result.data.length);

          // Convert notifications to HealthAlert format
          const alerts: HealthAlert[] = result.data
            .filter((notification: any) => {
              const isVitalAlert = notification.type === 'vital_alert' ||
                notification.type === 'hypertension_alert';
              console.log('Notification:', {
                id: notification._id,
                type: notification.type,
                patientId: notification.patientId,
                isVitalAlert
              });
              return isVitalAlert;
            })
            .map((notification: any) => {
              // Determine vital type and severity
              let vital = 'Unknown';
              let severity: 'critical' | 'warning' | 'info' = 'info';
              let category = notification.bpCategory;
              let value = 0;

              // Map notification types to vitals
              if (notification.type === 'hypertension_alert') {
                vital = 'Hypertension';
                value = notification.systolic || 0;

                // Map BP categories to severity
                if (notification.bpCategory === 'Hypertensive Crisis') {
                  severity = 'critical';
                } else if (notification.bpCategory === 'Stage 2' || notification.bpCategory === 'Stage 1') {
                  severity = 'critical';
                } else if (notification.bpCategory === 'Low Blood Pressure') {
                  severity = 'warning';
                }
              } else if (notification.type === 'vital_alert') {
                // Check if it's a glucose alert (diabetes)
                if (notification.metadata?.glucose !== undefined) {
                  vital = 'Diabetes';
                  value = notification.metadata.glucose;

                  // Determine glucose alert type
                  const glucose = notification.metadata.glucose;
                  const context = notification.metadata.context || 'Random';

                  if (glucose < 70) {
                    category = 'Low Blood Sugar';
                    severity = 'critical';
                  } else if (context === 'Fasting' && glucose > 125) {
                    category = 'High Fasting Glucose';
                    severity = 'critical';
                  } else if (context === 'Post-meal' && glucose > 180) {
                    category = 'High Post-meal Glucose';
                    severity = 'critical';
                  } else if (context === 'Random' && glucose > 200) {
                    category = 'High Random Glucose';
                    severity = 'critical';
                  } else {
                    severity = 'warning';
                  }
                } else {
                  // Generic vital alert
                  vital = 'General';
                  severity = notification.priority === 'critical' || notification.priority === 'high'
                    ? 'critical'
                    : 'warning';
                }
              }

              return {
                id: notification._id,
                severity,
                message: notification.message,
                timestamp: notification.createdAt,
                vital,
                value,
                category,
                recommendation: notification.title
              };
            });

          console.log('HealthAlerts: Filtered vital alerts:', alerts.length);
          console.log('HealthAlerts: Alerts:', alerts);
          setApiAlerts(alerts);
        } else {
          console.log('HealthAlerts: No data in response');
          setApiAlerts([]);
        }
      } catch (err: any) {
        console.error('HealthAlerts: Failed to fetch health alerts:', err);
        setError(err.message);
        setApiAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthAlerts();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchHealthAlerts, 30000);
    return () => clearInterval(interval);
  }, [patientId]);

  // Use API alerts if available, otherwise fall back to prop alerts
  const allAlerts = apiAlerts.length > 0 ? apiAlerts : propAlerts;

  // Filter out dismissed alerts
  const alerts = allAlerts.filter(alert => !dismissedAlertIds.has(alert.id));

  console.log('HealthAlerts: Rendering with', {
    totalAlerts: allAlerts.length,
    visibleAlerts: alerts.length,
    dismissedCount: dismissedAlertIds.size,
    loading
  });

  if (loading && apiAlerts.length === 0 && propAlerts.length === 0) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load health alerts: {error}
        </p>
      </div>
    );
  }


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

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
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

                  {/* Timestamp with time ago */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(alert.timestamp)}</span>
                    <span className="text-gray-400">•</span>
                    <span>{DashboardUtils.formatDate(alert.timestamp)}</span>
                  </div>
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