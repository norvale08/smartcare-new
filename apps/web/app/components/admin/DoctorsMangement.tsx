"use client";
import React, { useState, useEffect } from "react";
import DoctorsStats from "./DoctorsStats";
import DoctorsFilters from "./DoctorsFilters";
import DoctorsTable from "./DoctorsTable";
import DoctorDetailModal from "./DoctorDetailModal";
import EditDoctorModal from "./EditDoctorModal";
import { Download } from "lucide-react";
export type Doctor = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  diabetes: boolean;
  hypertension: boolean;
  conditions: string;
  createdAt: string;
};

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch doctors from API
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctors`);
      const result = await response.json();
      
      if (response.ok) {
        setDoctors(result.doctors || []);
      } else {
        console.error("Failed to fetch doctors:", result.message);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single doctor details
  const fetchDoctorDetails = async (doctorId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`);
      const result = await response.json();
      
      if (response.ok) {
        return result.doctor;
      } else {
        console.error("Failed to fetch doctor details:", result.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching doctor details:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleViewDoctor = async (doctor: Doctor) => {
    const doctorDetails = await fetchDoctorDetails(doctor._id);
    if (doctorDetails) {
      setViewingDoctor(doctorDetails);
    } else {
      alert("Failed to load doctor details");
    }
  };

  const handleEditDoctor = async (doctor: Doctor) => {
    const doctorDetails = await fetchDoctorDetails(doctor._id);
    if (doctorDetails) {
      setEditingDoctor(doctorDetails);
    } else {
      alert("Failed to load doctor details for editing");
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDoctors(doctors.filter(d => d._id !== doctorId));
        alert("Doctor deleted successfully!");
      } else {
        throw new Error("Failed to delete doctor");
      }
    } catch (error) {
      alert("Failed to delete doctor. Please try again.");
    }
  };

  const handleUpdateDoctor = async (doctorId: string, updatedData: any) => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (response.ok) {
        setDoctors(doctors.map(d => 
          d._id === doctorId ? { ...d, ...result.doctor } : d
        ));
        setEditingDoctor(null);
        alert("Doctor updated successfully!");
        return true;
      } else {
        throw new Error(result.message || "Failed to update doctor");
      }
    } catch (error: any) {
      alert(`Failed to update doctor: ${error.message}`);
      return false;
    }
  };

  const exportDoctors = () => {
    const filteredDoctors = getFilteredDoctors();
    const csvContent = [
      ["Name", "Email", "Phone", "Specialization", "License", "Hospital", "Treats Diabetes", "Treats Hypertension", "Registered Date"],
      ...filteredDoctors.map(doctor => [
        `${doctor.firstName} ${doctor.lastName}`,
        doctor.email,
        formatPhoneNumber(doctor.phoneNumber),
        getSpecializationDisplayName(doctor.specialization),
        doctor.licenseNumber,
        doctor.hospital,
        doctor.diabetes ? "Yes" : "No",
        doctor.hypertension ? "Yes" : "No",
        new Date(doctor.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doctors-list.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper functions
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  };

  const formatPhoneNumber = (phone: string | number): string => {
    if (!phone) return 'N/A';
    const phoneStr = String(phone);
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  };

  const getSpecializationDisplayName = (specialization: string) => {
    const names: { [key: string]: string } = {
      "general-practice": "General Practice",
      "endocrinology": "Endocrinology",
      "cardiology": "Cardiology",
      "nephrology": "Nephrology",
      "internal-medicine": "Internal Medicine",
      "other": "Other"
    };
    return names[specialization] || specialization;
  };

  const getFilteredDoctors = () => {
    return doctors.filter(doctor => {
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        safeToString(doctor.firstName).includes(searchLower) ||
        safeToString(doctor.lastName).includes(searchLower) ||
        safeToString(doctor.email).includes(searchLower) ||
        safeToString(doctor.licenseNumber).includes(searchLower) ||
        safeToString(doctor.hospital).includes(searchLower) ||
        safeToString(doctor.phoneNumber).includes(searchLower);

      const matchesSpecialization = 
        !filterSpecialization || 
        safeToString(doctor.specialization) === safeToString(filterSpecialization);

      const matchesCondition = 
        !filterCondition || 
        (filterCondition === "diabetes" && doctor.diabetes) ||
        (filterCondition === "hypertension" && doctor.hypertension);

      return matchesSearch && matchesSpecialization && matchesCondition;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredDoctors = getFilteredDoctors();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctors Management</h1>
          <p className="text-gray-600">
            Manage and view all registered medical professionals in the system
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={exportDoctors}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <DoctorsStats doctors={doctors} filteredDoctors={filteredDoctors} />

      {/* Search and Filters */}
      <DoctorsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterSpecialization={filterSpecialization}
        setFilterSpecialization={setFilterSpecialization}
        filterCondition={filterCondition}
        setFilterCondition={setFilterCondition}
      />

      {/* Doctors Table */}
      <DoctorsTable
        doctors={filteredDoctors}
        onViewDoctor={handleViewDoctor}
        onEditDoctor={handleEditDoctor}
        onDeleteDoctor={handleDeleteDoctor}
        formatPhoneNumber={formatPhoneNumber}
        getSpecializationDisplayName={getSpecializationDisplayName}
      />

      {/* Modals */}
      {viewingDoctor && (
        <DoctorDetailModal 
          doctor={viewingDoctor}
          onClose={() => setViewingDoctor(null)}
          onEdit={() => {
            setViewingDoctor(null);
            handleEditDoctor(viewingDoctor);
          }}
          formatPhoneNumber={formatPhoneNumber}
          getSpecializationDisplayName={getSpecializationDisplayName}
        />
      )}

      {editingDoctor && (
        <EditDoctorModal
          doctor={editingDoctor}
          onClose={() => setEditingDoctor(null)}
          onSave={handleUpdateDoctor}
          getSpecializationDisplayName={getSpecializationDisplayName}
        />
      )}
    </div>
  );
};

export default DoctorsManagement;