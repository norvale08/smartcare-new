"use client";
import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";
import StatsCard from "../components/admin/StatsCard";

import { BriefcaseMedical, Hospital, UsersRound } from "lucide-react";

export default function AdminPage() {
  // Temporary sample data (later we’ll fetch from Express backend)
  const doctors = [{ _id: "1", firstName: "John", lastName: "Doe", specialty: "Cardiology" }];
  const hospitals = [{ _id: "1", name: "Nairobi Hospital" }];
  const patients = [{ _id: "1", firstName: "Jane", lastName: "Doe" }];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-row">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Stats Section */}
        <div className="flex flex-row mt-6 gap-4 px-4">
          <StatsCard
            title="Total Doctors"
            value={doctors.length}
            subtitle="+12 this month"
            icon={<BriefcaseMedical />}
            bgColor="bg-emerald-100"
          />
          <StatsCard
            title="Hospitals"
            value={hospitals.length}
            subtitle="+3 this month"
            icon={<Hospital />}
            bgColor="bg-blue-100"
          />
          <StatsCard
            title="Patients"
            value={patients.length}
            subtitle="+30 this month"
            icon={<UsersRound />}
            bgColor="bg-purple-100"
          />
        </div>

        {/* Future management sections (like doctors, hospitals, patients) 
            will each have their own separate page */}
      </div>
    </div>
  );
}
