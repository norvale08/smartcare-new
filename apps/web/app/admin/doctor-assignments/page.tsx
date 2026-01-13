"use client";
import Sidebar from "../../components/admin/Sidebar";
import Header from "../../components/admin/Header";
import AdminDoctorAssignment from "../components/AdminDoctorAssignment";
import React, { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DoctorAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const refreshTrigger = () => {
    setLoading(true);
    // Add any additional refresh logic if needed
    setTimeout(() => {
      setLoading(false);
      toast.success("Data refreshed successfully", { duration: 2000 });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-row">
      <Toaster position="top-right" />
      
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Doctor Assignments</h1>
            <p className="text-gray-600 mt-1">Assign doctors to patients for better healthcare management</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading assignments...</p>
              </div>
            </div>
          )}

          {/* Doctor Assignment Component */}
          {!loading && (
            <AdminDoctorAssignment refreshTrigger={refreshTrigger} />
          )}
        </div>
      </div>
    </div>
  );
}
