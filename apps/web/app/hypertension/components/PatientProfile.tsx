"use client";
import Link from "next/link";
import React from "react";
import { useTranslation } from "../../../lib/hypertension/useTranslation";

interface PatientProfileProps {
  patient: any;
  vitals: any[];
  onEditClick: () => void;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patient, vitals, onEditClick }) => {
  const { t } = useTranslation();

  const computeAge = (dob?: string) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "—";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDateTime = (d?: Date | string | null) => {
    if (!d) return "—";
    try {
      const date = typeof d === "string" ? new Date(d) : d;
      if (isNaN(date.getTime())) return "—";
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return "—";
    }
  };

  const fullName = patient?.fullName || `${patient?.firstname ?? ""} ${patient?.lastname ?? ""}`.trim() || 
    (t.language === "en-US" ? "Unknown Patient" : "Mgonjwa Asiyejulikana");
  
  const initial = (patient?.fullName?.[0] || patient?.firstname?.[0] || "P").toUpperCase();
  const lastCheckIn = vitals.length > 0 ? vitals[vitals.length - 1]?.createdAt : null;

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 w-full border border-emerald-100/50 overflow-hidden relative">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full -mr-32 -mt-32" />
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transform hover:scale-105 transition-transform">
            <span className="text-white font-bold text-2xl">
              {initial}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              {fullName}
            </h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-emerald-700">{t.language === "en-US" ? "Age" : "Umri"}:</span>
                <span>{computeAge(patient?.dob)}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-emerald-700">{t.language === "en-US" ? "Weight" : "Uzito"}:</span>
                <span>{patient?.weight ?? "—"} kg</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-emerald-700">{t.language === "en-US" ? "Last check-in" : "Ukaguzi wa mwisho"}:</span>
                <span>{formatDateTime(lastCheckIn)}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile?step=5"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 font-semibold text-sm transform hover:scale-105"
          >
            {t.language === "en-US" ? "Edit Profile" : "Hariri Wasifu"}
          </Link>
          <div className="bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {patient?.status || (t.language === "en-US" ? "Active" : "Imekua")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
