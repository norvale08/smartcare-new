//page.tsx
'use client';

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from './components/Header';
import WelcomePanel from "./components/WelcomePanel";
import PatientsTable from "./components/AssignedPatients";
import VitalTrendsChart from "./components/VitalTrends";
import AnomalyDistributionChart from "./components/AnomalyDistribution";
import Alerts from "./components/AlertsPanel";
import PatientLocations from "./components/PatientLocation";
import CareManagement from "./components/CareManagement";
import PatientsTableSkeleton from "./components/PatientsTableSkeleton";



import { Patient, VitalTrend, DashboardStats, Prescription, CareNote, AnomalyPieData, AnomalyBarData } from "../../types/doctor";
import { formatRelativeTime } from "./lib/utils";


import {
  alerts,
} from "./lib/mockData";

const stats: DashboardStats = {
  date: new Date(),
};


const DoctorsDashboard = () => {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true); // track loading state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVital, setSelectedVital] = useState<keyof VitalTrend>("heartRate");

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;


  // Route protection: redirect unauthenticated doctors
  useEffect(() => {
    if (typeof window === "undefined") return; // guard SSR

    const verifyAuth = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setAuthChecked(true);
        router.push("/");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/verifyToken`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Token invalid");

        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth verification failed:", err);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        router.push("/");
      } finally {
        setAuthChecked(true);
      }
    };

    verifyAuth();
  }, [router, token, API_URL]);

  // helper fetch wrapper that adds Authorization header
  const authFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
  };


  // Fetch doctor info
  useEffect(() => {
    if (typeof window === "undefined") return; // guard SSR

    const fetchDoctor = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/doctorDashboard/doctor`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setDoctorName(data.name);
      } catch (err) {
        console.error("Error fetching doctor info:", err);
      }
    };
    if (token) fetchDoctor();
  }, [API_URL, token]);


  // Fetch ONLY assigned patients
  useEffect(() => {
    if (typeof window === "undefined") return; // guard SSR

    const fetchAssignedPatients = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/doctorDashboard/assignedPatients`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();

        // Transform backend -> frontend structure
        const transformed: Patient[] = data.map((p: any) => {
          const conditionList: string[] = [];
          if (p.conditions?.diabetes) conditionList.push("Diabetes");
          if (p.conditions?.hypertension) conditionList.push("Hypertension");

          const capitalize = (str: string) =>
            str ? str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";

          // Extract coordinates
          const coordinates = p.coordinates
            ? { lat: p.coordinates.lat, lng: p.coordinates.lng }
            : null;

          return {
            id: p._id,
            name: capitalize(p.fullName),
            age: new Date().getFullYear() - new Date(p.dob).getFullYear(),
            gender: capitalize(p.gender),
            condition: conditionList.length > 0 ? conditionList.join(", ") : "",
            vitals: p.vitals,
            riskLevel: p.riskLevel,
            location: p.location ?? "Unknown",
            coordinates: coordinates,
            lastUpdate: formatRelativeTime(p.updatedAt) || formatRelativeTime(p.createdAt),
          };
        });

        setPatients(transformed);
      } catch (err) {
        console.error("Error fetching assigned patients:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchAssignedPatients();
  }, [API_URL, token]);


  // Vital Trends
  const [vitalTrends, setVitalTrends] = useState<VitalTrend>({ heartRate: [], bloodPressure: [], glucose: [], bmi: [], });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${API_URL}/api/doctorDashboard/vitalTrends`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setVitalTrends(data);
      } catch (err) {
        console.error("Error fetching vital trends:", err);
      }
    };
    fetchTrends();
  }, [API_URL]);



  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);


  const carePanelRef = useRef<HTMLDivElement | null>(null);

  const handleViewCarePlan = (patient: Patient) => {
    setSelectedPatient(patient);
    setTimeout(() => {
      carePanelRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // slight delay to ensure component has rendered
  };



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


  // Compute anomaly distribution dynamically
  const anomalyDistributionPie: AnomalyPieData[] = [
    {
      risk: "critical",
      riskValue: patients.filter((p) => p.riskLevel === "critical").length,
    },
    {
      risk: "high",
      riskValue: patients.filter((p) => p.riskLevel === "high").length,
    },
    {
      risk: "low",
      riskValue: patients.filter((p) => p.riskLevel === "low").length,
    },
  ];


  const [anomalyDistributionBar, setAnomalyDistributionBar] = useState<AnomalyBarData[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchAnomalyDistribution = async () => {
      try {
        const res = await fetch(`${API_URL}/api/doctorDashboard/anomalyDistribution`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setAnomalyDistributionBar(data.anomalyDistributionBar);
      } catch (err) {
        console.error("Error fetching anomaly distribution:", err);
      }
    };
    fetchAnomalyDistribution();
  }, [API_URL]);


  const patientId = '12345'; // Replace with actual logic or dynamic value


  // Render Logic
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        alerts={alerts}
        patientId={patientId}
        token={token || ""}
      />

      <div className="p-6 space-y-6">
        <WelcomePanel
          stats={stats}
          patients={patients}
          loading={loading}   // pass loading state
          doctorName={doctorName} // pass doctor’s name
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <PatientsTableSkeleton />  // Show skeleton while loading
            ) : (
              <PatientsTable
                patients={filteredPatients}
                setSelectedPatient={handleViewCarePlan}
              />
            )}
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

            {selectedPatient && (
              <div ref={carePanelRef}>
                <CareManagement
                  selectedPatient={selectedPatient}
                  prescriptions={prescriptions}
                  careNotes={careNotes}
                  onAddPrescription={handleAddPrescription}
                  onAddCareNote={handleAddCareNote}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsDashboard;
