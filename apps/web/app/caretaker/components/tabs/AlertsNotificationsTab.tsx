import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Clock,
  ArrowRight,
  RefreshCw,
  Heart,
  MessageSquare,
  Phone,
  Activity,
  Calendar
} from 'lucide-react';
import { Patient } from '../../types';

interface Notification {
  id: string;
  type: 'vital_alert' | 'message' | 'call' | 'system' | 'appointment' | 'hypertension_alert';
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  bpCategory?: 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis';
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
}

interface AlertsNotificationsTabProps {
  patient: Patient;
}

const AlertsNotificationsTab: React.FC<AlertsNotificationsTabProps> = ({
  patient
}) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Mock data for demonstration - in real app, this would come from API
  React.useEffect(() => {
    // Simulate API call
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'hypertension_alert',
        title: 'High Blood Pressure Alert',
        message: 'Patient BP reading shows Stage 1 Hypertension',
        patientId: patient.id,
        patientName: patient.fullName,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false,
        priority: 'high',
        bpCategory: 'Stage 1',
        systolic: 145,
        diastolic: 92
      },
      {
        id: '2',
        type: 'vital_alert',
        title: 'Abnormal Heart Rate',
        message: 'Patient heart rate is elevated at 110 bpm',
        patientId: patient.id,
        patientName: patient.fullName,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        priority: 'medium',
        systolic: 130,
        diastolic: 85,
        heartRate: 110
      },
      {
        id: '3',
        type: 'appointment',
        title: 'Upcoming Appointment',
        message: 'Follow-up appointment scheduled for tomorrow at 2:00 PM',
        patientId: patient.id,
        patientName: patient.fullName,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: true,
        priority: 'low'
      },
      {
        id: '4',
        type: 'message',
        title: 'New Patient Message',
        message: 'Patient has a question about their medication dosage',
        patientId: patient.id,
        patientName: patient.fullName,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: true,
        priority: 'medium'
      }
    ];

    // Simulate loading delay
    const timer = setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [patient.id, patient.fullName]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'vital_alert':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'hypertension_alert':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'call':
        return <Phone className="w-4 h-4 text-green-500" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    // Special handling for hypertension alerts
    if (notification.type === 'hypertension_alert') {
      const bpColors = {
        'Hypertensive Crisis': 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 border-l-4 border-l-red-500',
        'Stage 2': 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 border-l-4 border-l-orange-500',
        'Stage 1': 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 border-l-4 border-l-yellow-500'
      };
      return bpColors[notification.bpCategory!] || 'border-gray-200 bg-gray-50';
    }

    const baseColors = {
      vital_alert: 'bg-gradient-to-r from-red-50 to-red-100 border-red-200',
      message: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
      call: 'bg-gradient-to-r from-green-50 to-green-100 border-green-200',
      system: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200',
      appointment: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200',
      hypertension_alert: 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
    };

    const priorityBorders = {
      critical: 'border-l-4 border-l-red-500',
      high: 'border-l-4 border-l-orange-500',
      medium: 'border-l-4 border-l-yellow-500',
      low: 'border-l-4 border-l-green-500',
    };

    return `${baseColors[notification.type]} ${priorityBorders[notification.priority]}`;
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const notificationTime = timestamp;
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    // Handle different notification types
    switch (notification.type) {
      case 'hypertension_alert':
        console.log(`Viewing ${notification.bpCategory} hypertension alert for ${notification.patientName}`);
        break;
      case 'message':
        console.log(`Opening conversation with ${notification.patientName}`);
        break;
      case 'vital_alert':
        console.log(`Viewing vital alert for ${notification.patientName}`);
        break;
      case 'appointment':
        console.log(`Viewing appointment details for ${notification.patientName}`);
        break;
      default:
        console.log('Viewing notification details');
    }
  };

  // Sort notifications with critical priority first
  const sortedNotifications = [...notifications].sort((a, b) => {
    // First: Prioritize unread notifications
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;
    
    // Second: Prioritize by priority (critical first)
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Third: Prioritize hypertension/vital alerts
    if (a.type === 'hypertension_alert' && b.type !== 'hypertension_alert') return -1;
    if (a.type !== 'hypertension_alert' && b.type === 'hypertension_alert') return 1;
    if (a.type === 'vital_alert' && b.type !== 'vital_alert') return -1;
    if (a.type !== 'vital_alert' && b.type === 'vital_alert') return 1;
    
    // Finally: Sort by timestamp (newest first)
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Alerts & Notifications</h3>
              <p className="text-sm text-gray-500">Real-time updates</p>
            </div>
          </div>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Alerts & Notifications</h3>
            <p className="text-sm text-gray-500">Real-time updates</p>
          </div>
        </div>
        <div className="text-center py-4 text-red-600 text-sm">
          Failed to load notifications: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Alerts & Notifications</h3>
            <p className="text-sm text-gray-500">Real-time updates for {patient.fullName}</p>
          </div>
        </div>
        <button
          onClick={() => {
            // Refresh notifications
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
            }, 1000);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh notifications"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No active notifications</p>
            <p className="text-xs text-gray-500">All systems normal</p>
          </div>
        ) : (
          sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${getNotificationColor(notification)} transition-all hover:shadow-md cursor-pointer ${
                notification.read ? 'opacity-80' : 'opacity-100'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        notification.priority === 'critical' ? 'text-red-800' :
                        notification.priority === 'high' ? 'text-orange-800' :
                        notification.priority === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          New
                        </span>
                      )}
                      {notification.bpCategory && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          notification.bpCategory === 'Hypertensive Crisis' ? 'bg-red-100 text-red-700' :
                          notification.bpCategory === 'Stage 2' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {notification.bpCategory}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    {notification.systolic && notification.diastolic && (
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          BP: {notification.systolic}/{notification.diastolic} mmHg
                        </div>
                      </div>
                    )}
                    {notification.heartRate && (
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          HR: {notification.heartRate} bpm
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(notification.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Mark as read functionality would go here
                  }}
                  title="Mark as read"
                >
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Summary */}
      {sortedNotifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Unread:</span>
              <span className="font-medium text-blue-600">
                {sortedNotifications.filter(n => !n.read).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Critical:</span>
              <span className="font-medium text-red-600">
                {sortedNotifications.filter(n => n.priority === 'critical').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium text-gray-900">
                {sortedNotifications.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hypertension:</span>
              <span className="font-medium text-orange-600">
                {sortedNotifications.filter(n => n.bpCategory).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions for Notifications */}
      {sortedNotifications.some(n => !n.read) && (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Unread Notifications
              </p>
              <p className="text-xs text-blue-600">
                {sortedNotifications.filter(n => !n.read).length} unread notification(s) - Click to view details
              </p>
            </div>
            <button 
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                // Mark all notifications as read
                console.log('Mark all as read');
              }}
            >
              Mark All Read
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsNotificationsTab;
