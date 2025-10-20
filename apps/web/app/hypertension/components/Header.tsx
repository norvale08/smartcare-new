"use client";

import React from "react";
import { HeartPulse, Globe } from "lucide-react";

interface HeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  patient: any;
}

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, patient }) => {
  const userName = patient?.fullName || "Sarah ";
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
      <div className="flex flex-row items-center gap-2">
        <HeartPulse color="#21a136" size={24} />
        <h1 className="text-xl font-semibold text-gray-800">
          SmartCare Dashboard
        </h1>
      </div>

      <div className="flex flex-row items-center gap-6">
        <button
          onClick={() => {
            const newLang = language === "en-US" ? "sw-TZ" : "en-US";
            onLanguageChange(newLang);
          }}
          className="flex flex-row bg-neutral-200 items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-300 transition-colors"
        >
          <Globe color="#27b049" size={16} />
          <span className="text-sm font-medium">{language === "en-US" ? "EN" : "SW"}</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{userInitials}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
