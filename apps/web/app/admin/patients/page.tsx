// admin/patients/page.tsx
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/admin/Sidebar";
import Header from "@/app/components/admin/Header";

interface Patient {
  _id: string;
  fullName: string;
  age: number;
  condition: string;
  doctorId?: { _id: string; firstName: string; lastName: string; specialty: string };
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    const res = await fetch(`${API_URL}/api/admin/patients`);
    const data = await res.json();
    setPatients(data);
    setLoading(false);
  };

  const fetchDoctors = async () => {
    const res = await fetch(`${API_URL}/api/admin/patients/doctors`);
    const data = await res.json();
    setDoctors(data);
  };

  const assignDoctor = async (patientId: string, doctorId: string) => {
    await fetch(`${API_URL}/api/admin/patients/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, doctorId }),
    });
    fetchPatients(); // refresh
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-row">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header />

        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Patients</h1>

          {loading ? (
            <p>Loading patients...</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Age</th>
                    <th className="px-4 py-2 text-left">Condition</th>
                    <th className="px-4 py-2 text-left">Assigned Doctor</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient._id} className="border-b">
                      <td className="px-4 py-2">
                        {patient.fullName}
                      </td>
                      <td className="px-4 py-2">{patient.age}</td>
                      <td className="px-4 py-2">{patient.condition}</td>
                      <td className="px-4 py-2">
                        {patient.doctorId
                          ? `${patient.doctorId.firstName} ${patient.doctorId.lastName} (${patient.doctorId.specialty})`
                          : "Unassigned"}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          className="border rounded p-1"
                          defaultValue={patient.doctorId?._id || ""}
                          onChange={(e) => assignDoctor(patient._id, e.target.value)}
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map((doc) => (
                            <option key={doc._id} value={doc._id}>
                              {doc.firstName} {doc.lastName} ({doc.specialty})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
