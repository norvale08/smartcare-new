//Notifications.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, AlertTriangle, Clock } from "lucide-react";

// Define the shape of an alert
export interface Alert {
  id: number;
  patient: string;
  message: string;
  time: string;
}

interface NotificationsProps {
  alerts: Alert[];
  show: boolean;
  toggle: () => void;
  token: string; // Add token prop to pass JWT
}

const Notifications: React.FC<NotificationsProps> = ({ alerts, show, toggle, token }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch unread count");

        const data = await res.json();
        setUnreadCount(data.total);
      } catch (error) {
        console.error("Notification fetch error:", error);
      }
    };

    fetchNotificationCount();
  }, [token]);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.patient}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{alert.time}</span>
                        </div>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-gray-500">No recent alerts.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;