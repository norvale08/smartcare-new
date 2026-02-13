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
  
  const userName = patient?.fullName || "Sarah";
  const userInitials = userName.slice(0, 2).toUpperCase();
  const patientId = patient?.patientId; // ✅ Extract patientId from patient data

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
    <header className="flex justify-between items-center px-8 py-4 bg-transparent">
      <div className="flex flex-row items-center gap-2">
        <HeartPulse className="text-white" size={24} />
        <h1 className="text-xl font-semibold text-white">
          {t.common.dashboard}
        </h1>
      </div>

      <div className="flex flex-row items-center gap-6">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="flex flex-row bg-white/20 backdrop-blur-sm text-white border border-white/30 items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors appearance-none pr-8"
          >
            {availableLanguages.map((lang: any) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Globe className="text-white" size={16} />
          </div>
        </div>
        
        {/* ✅ Patient ID Badge - only show if patientId exists */}
        {patientId && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
            <IdCard className="text-white" size={16} />
            <span className="text-sm font-mono font-semibold text-white">
              {patientId}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{userInitials}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {userName}
            </span>
            {/* ✅ Alternative: Show Patient ID below name on mobile/smaller screens */}
            {patientId && (
              <span className="text-xs font-mono text-white/80 sm:hidden">
                {patientId}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          title={language === "sw-TZ" ? "Toka" : "Logout"}
        >
          {loggingOut ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium">
                {language === "sw-TZ" ? "Inatoka..." : "Logging out..."}
              </span>
            </>
          ) : (
            <>
              <LogOut size={18} />
              <span className="text-sm font-medium">
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