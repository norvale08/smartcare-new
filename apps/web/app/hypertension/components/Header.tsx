"use client";

import React from "react";
import { HeartPulse, Globe, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Translations } from "../../../lib/hypertension/useTranslation";

interface HeaderProps {
  t: Translations;
  language: string;
  onLanguageChange: (lang: string) => void;
  patient: any;
}

const Header: React.FC<HeaderProps> = ({ t, language, onLanguageChange, patient }) => {
  const availableLanguages = [
    { code: "en-US", name: "English", nativeName: "English" },
    { code: "sw-TZ", name: "Swahili", nativeName: "Kiswahili" },
  ];
  const userName = patient?.fullName || "Sarah ";
  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
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
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{userInitials}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {userName}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;