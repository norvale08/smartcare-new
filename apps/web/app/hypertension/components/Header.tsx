"use client";

import React, { useState } from "react";
import { HeartPulse, Globe, LogOut, IdCard } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Translations } from "../../../lib/hypertension/useTranslation";

interface HeaderProps {
  t: Translations;
  language: string;
  onLanguageChange: (lang: string) => void;
  patient: any;
}

const Header: React.FC<HeaderProps> = ({ t, language, onLanguageChange, patient }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  
  const availableLanguages = [
    { code: "en-US", name: "English", nativeName: "English" },
    { code: "sw-TZ", name: "Swahili", nativeName: "Kiswahili" },
  ];
  
  const userName = patient?.fullName || patient?.name || "Sarah";
  const userInitials = userName.slice(0, 2).toUpperCase();
  const patientId = patient?.patientId || patient?.id; // ✅ More robust patient ID extraction

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback if next-auth fails
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
      <div className="flex flex-row items-center gap-2">
        <HeartPulse className="text-blue-600" size={24} />
        <h1 className="text-xl font-semibold text-gray-800">
          {t?.common?.dashboard || "Dashboard"}
        </h1>
      </div>

      <div className="flex flex-row items-center gap-4">
        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="appearance-none bg-gray-50 text-gray-800 border border-gray-300 pl-4 pr-10 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
        </div>
        
        {/* ✅ Patient ID Badge - only show if patientId exists */}
        {patientId && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <IdCard className="text-blue-600" size={16} />
            <span className="text-sm font-mono font-medium text-blue-700">
              ID: {patientId}
            </span>
          </div>
        )}
        
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">{userInitials}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">
              {userName}
            </span>
            {/* ✅ Show Patient ID below name on mobile */}
            {patientId && (
              <span className="text-xs font-mono text-gray-500 sm:hidden">
                ID: {patientId}
              </span>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
          title={language === "sw-TZ" ? "Toka" : "Logout"}
        >
          {loggingOut ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium text-red-600">
                {language === "sw-TZ" ? "Inatoka..." : "Logging out..."}
              </span>
            </>
          ) : (
            <>
              <LogOut size={18} className="text-red-600" />
              <span className="text-sm font-medium text-red-600">
                {language === "sw-TZ" ? "Toka" : "Logout"}
              </span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;