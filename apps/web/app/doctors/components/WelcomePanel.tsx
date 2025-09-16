'use client';
import React, { useState } from "react";
import { DashboardStats, Alert, Patient } from "@/types/doctor";


interface WelcomePanelProps {
  stats: DashboardStats;
  patients: Patient[];
  alerts: Alert[];
}

export default function WelcomePanel({ stats, patients, alerts }: WelcomePanelProps) {
  const [allAlerts] = useState<Alert[]>(alerts);
  const [filteredPatients] = useState<Patient[]>(patients);

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
            <div className="text-3xl font-bold">{allAlerts.filter(a => a.severity === 'critical').length}</div>
            <div className="text-blue-100">Critical Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{filteredPatients.length}</div>
            <div className="text-blue-100">Assigned Patients</div>
          </div>
        </div>
      </div>
    </div>

  );
}
