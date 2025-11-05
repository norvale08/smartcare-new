// app/caretaker/components/RealTimeNotifications.tsx
import React, { useState, useEffect } from 'react';
import { X, Bell, Phone, MessageSquare, Activity } from 'lucide-react';

interface Notification {
  id: string;
  type: 'vital_alert' | 'message' | 'call' | 'system';
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  timestamp: Date;
  read: boolean;
}

const RealTimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Simulate real-time notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'vital_alert',
        title: 'Critical Vitals Alert',
        message: 'Blood pressure reading critically high',
        patientId: '123',
        patientName: 'John Doe',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'message',
        title: 'New Message',
        message: 'Patient sent a new message',
        patientId: '124',
        patientName: 'Jane Smith',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false
      }
    ];

    setNotifications(mockNotifications);
    setIsVisible(true);

    // Simulate incoming notifications
    const interval = setInterval(() => {
      // In real app, this would come from WebSocket
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'vital_alert',
        title: 'New Vitals Data',
        message: 'Patient submitted new readings',
        patientId: '125',
        patientName: 'Mike Johnson',
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      setIsVisible(true);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'vital_alert':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'call':
        return <Phone className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'vital_alert':
        return 'border-red-200 bg-red-50';
      case 'message':
        return 'border-blue-200 bg-blue-50';
      case 'call':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length === 1) {
      setIsVisible(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-lg border">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-sm">Notifications</span>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {notifications.length}
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
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg border transform transition-all duration-300 ${getNotificationColor(notification.type)} ${
              notification.read ? 'opacity-75' : 'opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
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
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
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
                onClick={() => dismissNotification(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeNotifications;