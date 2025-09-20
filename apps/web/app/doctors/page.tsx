"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from './components/Header';
import WelcomePanel from "./components/WelcomePanel";
import PatientsTable from "./components/AssignedPatients";
import VitalTrendsChart from "./components/VitalTrends";
import AnomalyDistributionChart from "./components/AnomalyDistribution";
import Alerts from "./components/AlertsPanel";
import PatientLocations from "./components/PatientLocation";
import CareManagement from "./components/CareManagement";
import RequestManagement from "./components/RequestManagement";

import { Patient, VitalTrend, DashboardStats, Prescription, CareNote } from "../../types/doctor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DoctorsDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [vitalTrends, setVitalTrends] = useState<VitalTrend[]>([]);
  const [anomalyDistribution, setAnomalyDistribution] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVital, setSelectedVital] = useState<keyof VitalTrend>("heartRate");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);

  const token = localStorage.getItem("token") || "";

  const stats: DashboardStats = { date: new Date() };

  // 🔑 Fetch real patients
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchPatients = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/doctor/patients`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setPatients(res.data?.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch patients", err);
      }
    };

    fetchPatients();
  }, []);

  // Example: fetch alerts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchAlerts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/emergency`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setAlerts(res.data?.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch alerts", err);
      }
    };

    fetchAlerts();
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        alerts={alerts}
        patientId={selectedPatient?.id?.toString() || ""}
        token={localStorage.getItem("token") || ""}
      />

      <div className="p-6 space-y-6">
        <WelcomePanel stats={stats} patients={patients} alerts={alerts} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PatientsTable patients={filteredPatients} setSelectedPatient={setSelectedPatient} />
            {/* {vitalTrends.length > 0 && (
              <VitalTrendsChart
                vitalTrends={vitalTrends[0]}
                selectedVital={selectedVital}
                setSelectedVital={setSelectedVital}
              />
            )} */}
            <AnomalyDistributionChart
              anomalyDistributionPie={anomalyDistribution.filter(d => d.risk)}
              anomalyDistributionBar={anomalyDistribution.filter(d => d.vital)}
            />
          </div>

          <div className="space-y-6">
            <Alerts alerts={alerts} />
            <PatientLocations patients={patients} />
            <RequestManagement token={token} />
            {selectedPatient && (
              <CareManagement
                selectedPatient={selectedPatient}
                prescriptions={prescriptions}
                careNotes={careNotes}
                onAddPrescription={(p) =>
                  setPrescriptions(prev => [...prev, { id: Math.random().toString(), ...p }])
                }
                onAddCareNote={(n) =>
                  setCareNotes(prev => [...prev, { id: Math.random().toString(), ...n }])
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsDashboard;
