// app/caretaker/components/AlertsPanel.tsx
import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Bell,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Patient } from '../types';

interface AlertsPanelProps {
  patient: Patient;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ patient }) => {
  // Mock alerts based on patient status and condition
  const getAlerts = (patient: Patient) => {
    const baseAlerts = [];
    
    // Status-based alerts
    if (patient.status === 'critical') {
      baseAlerts.push({
        id: 1,
        type: 'critical' as const,
        title: 'Critical Condition',
        message: 'Patient requires immediate medical attention',
        timestamp: new Date().toISOString(),
        actionRequired: true
      });
    } else if (patient.status === 'warning') {
      baseAlerts.push({
        id: 2,
        type: 'warning' as const,
        title: 'Abnormal Readings',
        message: 'Some vitals outside normal range',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        actionRequired: false
      });
    }

    // Condition-based alerts
    if (patient.condition === 'hypertension' || patient.condition === 'both') {
      baseAlerts.push({
        id: 3,
        type: 'info' as const,
        title: 'Hypertension Management',
        message: 'Next BP medication review due in 2 weeks',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        actionRequired: false
      });
    }

    if (patient.condition === 'diabetes' || patient.condition === 'both') {
      baseAlerts.push({
        id: 4,
        type: 'info' as const,
        title: 'Diabetes Care',
        message: 'Quarterly HbA1c test scheduled',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        actionRequired: false
      });
    }

    // General alerts
    baseAlerts.push({
      id: 5,
      type: 'info' as const,
      title: 'Routine Check-up',
      message: 'Annual physical examination pending',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      actionRequired: false
    });

    return baseAlerts;
  };

  const alerts = getAlerts(patient);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No active alerts</p>
            <p className="text-xs text-gray-500">All systems normal</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getAlertColor(alert.type)} transition-colors hover:shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-medium ${
                        alert.type === 'critical' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {alert.title}
                      </h4>
                      {alert.actionRequired && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          Action Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Critical: {alerts.filter(a => a.type === 'critical').length}</span>
            <span>Warnings: {alerts.filter(a => a.type === 'warning').length}</span>
            <span>Info: {alerts.filter(a => a.type === 'info').length}</span>
          </div>
        </div>
      )}

      {/* Quick Actions for Alerts */}
      {alerts.some(a => a.actionRequired) && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">
                Action Required
              </p>
              <p className="text-xs text-red-600">
                {alerts.filter(a => a.actionRequired).length} urgent item(s) need attention
              </p>
            </div>
            <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
              Review All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;