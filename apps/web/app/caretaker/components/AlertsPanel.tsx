import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Bell,
  Clock,
  ArrowRight,
  RefreshCw,
  Heart,
  MessageSquare,
  Phone,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Patient } from '../types';

type GlucoseContext = 'Fasting' | 'Post-meal' | 'Random';

type GlucoseAlertType = 'high_fasting' | 'high_post_meal' | 'high_random';

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
  // Diabetes / glucose specific fields
  glucose?: number;
  glucoseContext?: GlucoseContext;
  glucoseAlertType?: GlucoseAlertType;
}

interface AlertsPanelProps {
  patient: Patient;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ patient }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getGlucoseAlertType = (glucose?: number, context?: GlucoseContext): GlucoseAlertType | undefined => {
    if (!glucose || !context) return undefined;

    // Mirror backend SmartCareAI glucose thresholds, but only surface HIGH values
    if (glucose < 70) {
      return undefined; // low glucose handled by generic vital alert UI
    }

    if (context === 'Fasting') {
      if (glucose > 125) return 'high_fasting';
      return undefined;
    }

    if (context === 'Post-meal') {
      if (glucose > 180) return 'high_post_meal';
      return undefined;
    }

    // Random
    if (glucose > 200) return 'high_random';
    return undefined;
  };

  // Fetch ALL real notifications from API for this specific patient (no mock data)
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use patient.id or patient.userId as fallback
      const patientIdentifier = patient.id || patient.userId;
      if (!patientIdentifier) {
        setError('Patient identifier not found');
        setNotifications([]);
        return;
      }

      // Fetch ALL notifications for this specific patient (read + unread, no filters)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/patient/${patientIdentifier}?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No notifications found for this patient - this is fine, just show empty state
          setNotifications([]);
          return;
        }
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const realNotifications: Notification[] = result.data.map((notification: any) => {
          const glucose = notification.metadata?.glucose as number | undefined;
          const glucoseContext = notification.metadata?.context as GlucoseContext | undefined;
          const glucoseAlertType = getGlucoseAlertType(glucose, glucoseContext);

          return {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            patientId: notification.patientId,
            patientName: notification.patientName,
            timestamp: new Date(notification.createdAt),
            read: notification.read || false,
            priority: notification.priority || 'medium',
            bpCategory: notification.bpCategory,
            systolic: notification.systolic,
            diastolic: notification.diastolic,
            glucose,
            glucoseContext,
            glucoseAlertType
          };
        });
        
        setNotifications(realNotifications);
      } else {
        // No notifications found - show empty state
        setNotifications([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      setError(error.message);
      // NO mock data fallback - show error state instead
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        // Update the notification as read in the local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Setup polling for new notifications
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Poll for new notifications every 10 seconds (more frequent for critical alerts)
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [patient.id, patient.userId]); // Re-fetch when patient changes

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'vital_alert':
        return <Activity className="w-4 h-4 text-emerald-500" />;
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
    // Special styling for diabetes glucose alerts
    if (notification.glucoseAlertType) {
      return 'bg-gradient-to-r from-cyan-50 via-emerald-50 to-blue-50 border-cyan-200 border-l-4 border-l-emerald-500';
    }

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
    
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
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
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
            <p className="text-xs text-gray-500">Real-time updates</p>
          </div>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400 ml-auto" />
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
            <p className="text-xs text-gray-500">Real-time updates</p>
          </div>
        </div>
        <div className="text-center py-4 text-red-600 text-sm">
          Failed to load notifications: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
            <p className="text-xs text-gray-500">Real-time updates</p>
          </div>
        </div>
        <button
          onClick={fetchNotifications}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh notifications"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
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
                    {/* Diabetes-specific glucose indicators */}
                    {notification.glucoseAlertType && notification.glucose && (
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                          {notification.glucoseAlertType === 'high_fasting' && 'High fasting blood sugar'}
                          {notification.glucoseAlertType === 'high_post_meal' && 'High post-meal blood sugar'}
                          {notification.glucoseAlertType === 'high_random' && 'High random blood sugar'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-cyan-100 text-cyan-800">
                          Glucose: {notification.glucose} mg/dL
                          {notification.glucoseContext && (
                            <span className="ml-1">
                              ({notification.glucoseContext})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {notification.systolic && notification.diastolic && (
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          BP: {notification.systolic}/{notification.diastolic} mmHg
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
                    markAsRead(notification.id);
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
                sortedNotifications
                  .filter(n => !n.read)
                  .forEach(notification => markAsRead(notification.id));
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

export default AlertsPanel;
