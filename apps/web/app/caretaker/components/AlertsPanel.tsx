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
  Activity
} from 'lucide-react';
import { Patient } from '../types';

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
}

interface AlertsPanelProps {
  patient: Patient;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ patient }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real notifications from API (same as RealTimeNotifications)
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch notifications for this specific patient
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/patient/${patient.id}?limit=20&read=false`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No notifications found for this patient
          setNotifications([]);
          return;
        }
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const realNotifications: Notification[] = result.data.map((notification: any) => ({
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          patientId: notification.patientId,
          patientName: notification.patientName,
          timestamp: new Date(notification.createdAt),
          read: notification.read,
          priority: notification.priority,
          bpCategory: notification.bpCategory,
          systolic: notification.systolic,
          diastolic: notification.diastolic
        }));
        
        setNotifications(realNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      setError(error.message);
      // Fallback to mock data if API fails
      
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
  }, [patient.id]);

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
        'Hypertensive Crisis': 'bg-red-50 border-red-200 border-l-4 border-l-red-500',
        'Stage 2': 'bg-orange-50 border-orange-200 border-l-4 border-l-orange-500',
        'Stage 1': 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500'
      };
      return bpColors[notification.bpCategory!] || 'border-gray-200 bg-gray-50';
    }

    const baseColors = {
      vital_alert: 'border-red-200 bg-red-50',
      message: 'border-blue-200 bg-blue-50',
      call: 'border-green-200 bg-green-50',
      system: 'border-gray-200 bg-gray-50',
      appointment: 'border-purple-200 bg-purple-50',
      hypertension_alert: 'border-red-200 bg-red-50'
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
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
        </div>
        <div className="text-center py-4 text-red-600 text-sm">
          Failed to load notifications: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
        </div>
        <button
          onClick={fetchNotifications}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh notifications"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No active notifications</p>
            <p className="text-xs text-gray-500">All systems normal</p>
          </div>
        ) : (
          sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${getNotificationColor(notification)} transition-colors hover:shadow-sm cursor-pointer ${
                notification.read ? 'opacity-75' : 'opacity-100'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-medium ${
                        notification.priority === 'critical' ? 'text-red-800' :
                        notification.priority === 'high' ? 'text-orange-800' :
                        notification.priority === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          New
                        </span>
                      )}
                      {notification.bpCategory && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.bpCategory === 'Hypertensive Crisis' ? 'bg-red-100 text-red-700' :
                          notification.bpCategory === 'Stage 2' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {notification.bpCategory}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    {notification.systolic && notification.diastolic && (
                      <p className="text-xs text-gray-500 mt-1">
                        BP: {notification.systolic}/{notification.diastolic} mmHg
                      </p>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(notification.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  title="Mark as read"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Summary */}
      {sortedNotifications.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Unread: {sortedNotifications.filter(n => !n.read).length}</span>
            <span>Critical: {sortedNotifications.filter(n => n.priority === 'critical').length}</span>
            <span>Total: {sortedNotifications.length}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Hypertension: {sortedNotifications.filter(n => n.bpCategory).length}</span>
            <span>Messages: {sortedNotifications.filter(n => n.type === 'message').length}</span>
          </div>
        </div>
      )}

      {/* Quick Actions for Notifications */}
      {sortedNotifications.some(n => !n.read) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Unread Notifications
              </p>
              <p className="text-xs text-blue-600">
                {sortedNotifications.filter(n => !n.read).length} unread notification(s)
              </p>
            </div>
            <button 
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
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

// Add missing Calendar icon component
const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default AlertsPanel;