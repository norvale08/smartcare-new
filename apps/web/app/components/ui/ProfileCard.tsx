"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Patient {
  fullName?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  weight?: number;
  height?: number;
  phoneNumber?: string;
  status?: string;
  selectedDiseases?: string[];
}

function computeAge(dob?: string) {
  if (!dob) return "—";
  const birthDate = new Date(dob);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const ProfileCard: React.FC = () => {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:3001/api/patient/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch patient profile");

        const data = await res.json();
        setPatient(data.data || null);
      } catch (err) {
        console.error("❌ Error fetching patient profile:", err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl flex justify-between items-center">
      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xl">
            {patient?.fullName?.[0] || patient?.firstname?.[0] || "P"}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {patient?.fullName || `${patient?.firstname ?? ""} ${patient?.lastname ?? ""}`.trim() || "Unknown Patient"}
          </h2>
          <p className="text-sm text-gray-600">
            Age: {computeAge(patient?.dob)} | Weight: {patient?.weight ?? "—"} kg
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/profile")}
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
};

export default ProfileCard;
