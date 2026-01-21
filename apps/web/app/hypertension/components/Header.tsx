"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { HeartPulse, Globe, LogOut } from "lucide-react";
import { Translations } from "../../../lib/hypertension/useTranslation";

interface HeaderProps {
  t: Translations;
  language: string;
  onLanguageChange: (lang: string) => void;
  patient: any;
}

const Header: React.FC<HeaderProps> = ({ t, language, onLanguageChange, patient }) => {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const availableLanguages = [
    { code: "en-US", name: "English", nativeName: "English" },
    { code: "sw-TZ", name: "Swahili", nativeName: "Kiswahili" },
  ];
  
  const userName = patient?.fullName || "Sarah ";
  const userInitials = userName.slice(0, 2).toUpperCase();

  // CORRECTED: Single handleLogout function
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      
      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("preferredLanguage");
      }

      // Sign out from NextAuth
      await signOut({ 
        redirect: false,
        callbackUrl: "/login" 
      });

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if there's an error
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
      <div className="flex flex-row items-center gap-2">
        <HeartPulse color="#21a136" size={24} />
        <h1 className="text-xl font-semibold text-gray-800">
          {t.common.dashboard}
        </h1>
      </div>

      <div className="flex flex-row items-center gap-6">
        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="flex flex-row bg-neutral-200 items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-300 transition-colors appearance-none pr-8"
          >
            {availableLanguages.map((lang: any) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Globe color="#27b049" size={16} />
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{userInitials}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {userName}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">
            {loggingOut 
              ? (language === "sw-TZ" ? "Inatoka..." : "Logging out...") 
              : (language === "sw-TZ" ? "Toka" : "Logout")}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;