"use client";
import React, { useEffect, useState } from "react";
import MultiStepForm from "../components/forms/MultiStepForm";

interface PatientData {
  fullName?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  weight?: number;
  height?: number;
  phoneNumber?: string;
  relationship?: string;
  diabetes?: boolean;
  hypertension?: boolean;
  cardiovascular?: boolean;
  surgeries?: string;
  allergies?: string;
  gender?: string;
}

const ProfileUpdatePage: React.FC = () => {
  const [patient, setPatient] = useState<PatientData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:3001/api/patient/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch patient profile");

        const { data } = await res.json();
        setPatient(data || null);
      } catch (err) {
        console.error("❌ Error fetching patient profile:", err);
      }
    };

    fetchProfile();
  }, []);

  if (!patient) return <p>Loading profile...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Update Your Profile</h1>
      {/* Pass patient data to MultiStepForm to pre-fill the form */}
      <MultiStepForm patientData={patient} />
    </div>
  );
};

export default ProfileUpdatePage;
