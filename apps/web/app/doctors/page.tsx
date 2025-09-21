'use client';

import React, { useState } from "react";
import Header from './components/Header';
import WelcomePanel from "./components/WelcomePanel";
import PatientsTable from "./components/AssignedPatients";
import VitalTrendsChart from "./components/VitalTrends";
import AnomalyDistributionChart from "./components/AnomalyDistribution";
import Alerts from "./components/AlertsPanel";
import PatientLocations from "./components/PatientLocation";
import CareManagement from "./components/CareManagement";


import { Patient, VitalTrend, DashboardStats, Prescription, CareNote } from "../../types/doctor";


import {
  patients,
  alerts,
  vitalTrends,
  anomalyDistribution,
} from "./lib/mockData";

const stats: DashboardStats = {
  date: new Date(),
};

const anomalyDistributionPie = anomalyDistribution.filter(
  (d) => d.risk && typeof d.riskValue === "number"
);

const anomalyDistributionBar = anomalyDistribution.filter(
  (d) => d.vital && typeof d.vitalValue === "number"
);

const DoctorsDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVital, setSelectedVital] = useState<keyof VitalTrend>("heartRate");

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);

  const handleAddPrescription = (newPrescription: Omit<Prescription, 'id'>) => {
    const newEntry: Prescription = {
      id: Math.random().toString(), // or use uuid
      ...newPrescription,
    };
    setPrescriptions(prev => [...prev, newEntry]);
  };

  const handleAddCareNote = (newNote: Omit<CareNote, 'id'>) => {
    const newEntry: CareNote = {
      id: Math.random().toString(),
      ...newNote,
    };
    setCareNotes(prev => [...prev, newEntry]);
  };


  const patientId = '12345'; // Replace with actual logic or dynamic value
  const token = 'your-auth-token'; // Possibly from auth context or localStorage

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        alerts={alerts}
        patientId={patientId}
        token={token}
      />

      <div className="p-6 space-y-6">
        <WelcomePanel
          stats={stats}
          patients={patients}
          alerts={alerts} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <PatientsTable
              patients={filteredPatients}
              setSelectedPatient={setSelectedPatient}
            />
            <VitalTrendsChart
              vitalTrends={vitalTrends}
              selectedVital={selectedVital}
              setSelectedVital={setSelectedVital}
            />
            <AnomalyDistributionChart
              anomalyDistributionPie={anomalyDistributionPie}
              anomalyDistributionBar={anomalyDistributionBar}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Alerts alerts={alerts} />
            <PatientLocations patients={patients} />
            {selectedPatient && <CareManagement
              selectedPatient={selectedPatient}
              prescriptions={prescriptions}
              careNotes={careNotes}
              onAddPrescription={handleAddPrescription}
              onAddCareNote={handleAddCareNote} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsDashboard;
