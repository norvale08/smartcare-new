// app/admin/doctors/page.tsx
"use client";
import { useState } from "react";
import DoctorsRegistration from "@/app/components/admin/doctorsRegistration";
import DoctorsManagement from "@/app/components/admin/DoctorsMangement";

export default function Page() {
  const [activeTab, setActiveTab] = useState<"register" | "manage">("manage");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("manage")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "manage"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Manage Doctors
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "register"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Register New Doctor
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "register" ? <DoctorsRegistration /> : <DoctorsManagement />}
      </div>
    </div>
  );
}