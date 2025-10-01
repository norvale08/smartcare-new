//WelcomePanel.tsx
'use client';
import React from "react";
import { DashboardStats, Patient } from "@/types/doctor";


interface WelcomePanelProps {
  stats: DashboardStats;
  patients: Patient[];
  loading?: boolean;
}

export default function WelcomePanel({ stats, patients, loading }: WelcomePanelProps) {
  // Count patients by risk level
  const criticalCases = patients.filter(p => p.riskLevel === "critical").length;
  const highCases = patients.filter(p => p.riskLevel === "high").length;

  // Decide what to display
  const displayCases = criticalCases > 0 ? criticalCases : highCases;
  const displayLabel = criticalCases > 0 ? "Critical Cases" : "High Risk Cases";

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
      {/* Welcome Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, Dr. Smith</h2>
          <p className="text-blue-100 mt-1">
            Here's your patient overview for {stats.date.toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-8">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                displayCases
              )}
            </div>
            <div className="text-blue-100">{displayLabel}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {loading ? (
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                patients.length
              )}
            </div>
            <div className="text-blue-100">Assigned Patients</div>
          </div>
        </div>
      </div>
    </div>

  );
}
