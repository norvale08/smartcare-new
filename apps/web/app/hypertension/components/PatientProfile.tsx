"use client";
import Link from "next/link";
import React from "react";

interface PatientProfileProps {
  patient: any;
  vitals: any[];
  onEditClick: () => void;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patient, vitals, onEditClick }) => {
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

  const fullName = patient?.fullName || `${patient?.firstname ?? ""} ${patient?.lastname ?? ""}`.trim() || "Unknown Patient";
  const initial = (patient?.fullName?.[0] || patient?.firstname?.[0] || "P").toUpperCase();
  const lastCheckIn = vitals.length > 0 ? vitals[vitals.length - 1]?.createdAt : null;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl flex justify-between items-center">
      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xl">
            {initial}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {fullName}
          </h2>
          <p className="text-sm text-gray-600">
            Age: {computeAge(patient?.dob)} | Weight: {patient?.weight ?? "—"} kg
            <br />
            Last check-in: {formatDateTime(lastCheckIn)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
  href="/profile?step=5"
  className="inline-block px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm border border-blue-200 font-medium text-sm"
>
  Edit Profile
</Link>
        <div className="bg-emerald-400 text-white rounded-full px-4 py-2 text-sm font-medium">
          ● {patient?.status || "Active"}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
