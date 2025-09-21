"use client"
import React from "react";

export default function ProfileCard({ patient, lastCheckIn, onEdit }: { patient: any; lastCheckIn: string; onEdit: () => void }) {
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

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl flex justify-between items-center">
      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xl">
            {(patient?.fullName?.[0] || patient?.firstname?.[0] || "P")}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {patient?.fullName || `${patient?.firstname ?? ""} ${patient?.lastname ?? ""}`.trim() || "Unknown Patient"}
          </h2>
          <p className="text-sm text-gray-600">
            Age: {computeAge(patient?.dob)} | Weight: {patient?.weight ?? "—"} kg
            <br />
            Last check-in: {lastCheckIn}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onEdit}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Edit Profile
        </button>
        <div className="bg-emerald-400 text-white rounded-full px-4 py-2 text-sm font-medium">
          ● {patient?.status || "Active"}
        </div>
      </div>
    </div>
  );
}


