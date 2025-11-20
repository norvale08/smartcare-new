// Header.tsx
"use client";

import {
  Stethoscope,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import Notifications from "./Notifications";
import Messages from "./Message";
import DownloadButton from "./DownloadButton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from '@/types/doctor';

// Props interface
interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  alerts: Alert[];
  patientId: string;
  token: string;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, alerts, patientId, token }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleLogout = async () => {
    try {
      // Optionally notify backend to clear session
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // Remove token from local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // if stored
      // Redirect to home page
      router.push("/");
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">SmartCare Patient Monitoring Dashboard</h1>
            <p className="text-sm text-gray-500">Doctor Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notifications */}
          <Notifications
            alerts={alerts}
            show={showNotifications}
            toggle={() => setShowNotifications(!showNotifications)}
            token={token}
          />

          {/* Messages */}
          <Messages
            show={showMessages}
            toggle={() => setShowMessages(!showMessages)}
            token={token}
            patientId={patientId}
          />

          {/* Download PDF Button */}
          <DownloadButton patientId={patientId} token={token} />

          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;