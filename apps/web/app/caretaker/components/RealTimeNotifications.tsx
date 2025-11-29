import React, { useState, useEffect } from 'react';
import { X, Bell, Phone, MessageSquare, Activity, Heart } from 'lucide-react';

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

interface RealTimeNotificationsProps {
  onNotificationSelect?: (payload: {
    notification: Notification;
    preferredTab: 'overview' | 'messages' | 'medications' | 'appointments';
  }) => void;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ onNotificationSelect }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch real notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications?limit=10&read=false`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
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
          // Only show if there are unread notifications
          setIsVisible(realNotifications.length > 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Add mock hypertension alerts for demo
      setNotifications(getMockHypertensionAlerts());
      setIsVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Mock hypertension alerts for demo
  const getMockHypertensionAlerts = (): Notification[] => {
    const hypertensionStages = [
      { category: 'Stage 1', priority: 'medium', systolic: 135, diastolic: 85 },
      { category: 'Stage 2', priority: 'high', systolic: 155, diastolic: 95 },
      { category: 'Hypertensive Crisis', priority: 'critical', systolic: 185, diastolic: 115 }
    ];

    return hypertensionStages.map((stage, index) => ({
      id: `hypertension-${index}-${Date.now()}`,
      type: 'hypertension_alert',
      title: `${stage.category} Hypertension Detected`,
      message: `Patient has ${stage.category.toLowerCase()} blood pressure: ${stage.systolic}/${stage.diastolic} mmHg`,
      patientId: 'demo-patient',
      patientName: 'Demo Patient',
      timestamp: new Date(),
      read: false,
      priority: stage.priority as 'medium' | 'high' | 'critical',
      bpCategory: stage.category as 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis',
      systolic: stage.systolic,
      diastolic: stage.diastolic
    }));
  };

  // Setup polling for new notifications
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Poll for new notifications every 10 seconds (more frequent for critical alerts)
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Hide if no more notifications
      if (notifications.length <= 1) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

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
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    // Special handling for hypertension alerts
    if (notification.type === 'hypertension_alert') {
      const bpColors = {
        'Hypertensive Crisis': 'border-red-200 bg-red-50 border-l-4 border-l-red-500',
        'Stage 2': 'border-orange-200 bg-orange-50 border-l-4 border-l-orange-500',
        'Stage 1': 'border-yellow-200 bg-yellow-50 border-l-4 border-l-yellow-500'
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

  const dismissNotification = async (id: string) => {
    await markAsRead(id);
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setNotifications([]);
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const resolvePreferredTab = (notification: Notification): 'overview' | 'messages' | 'medications' | 'appointments' => {
    switch (notification.type) {
      case 'message':
        return 'messages';
      case 'appointment':
        return 'appointments';
      case 'call':
        return 'overview';
      case 'hypertension_alert':
      case 'vital_alert':
      default:
        return 'overview';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Handle different notification types
    switch (notification.type) {
      case 'hypertension_alert':
        // Navigate to patient vitals or detailed BP view
        alert(`Viewing ${notification.bpCategory} hypertension alert for ${notification.patientName}`);
        break;
      case 'message':
        alert(`Opening conversation with ${notification.patientName || 'contact'}`);
        break;
      case 'call':
        if (notification.patientName) {
          alert(`Initiating call with ${notification.patientName}`);
        }
        break;
      case 'vital_alert':
        alert(`Viewing vital alert for ${notification.patientName || 'patient'}`);
        break;
      default:
        alert('Viewing notification details');
    }
    
    if (onNotificationSelect) {
      onNotificationSelect({
        notification,
        preferredTab: resolvePreferredTab(notification)
      });
    }

    // Mark as read when clicked
    markAsRead(notification.id);
  };

  // Sort notifications with critical priority first, then by type
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

  if (!isVisible || sortedNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-lg border">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-sm">Notifications</span>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {sortedNotifications.length}
          </span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all read
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : sortedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg transform transition-all duration-300 cursor-pointer ${getNotificationColor(notification)} ${
              notification.read ? 'opacity-75' : 'opacity-100 hover:shadow-xl'
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
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
                  {notification.patientName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Patient: {notification.patientName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-2">
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Close notifications
        </button>
      </div>
    </div>
  );
};

export default RealTimeNotifications;
