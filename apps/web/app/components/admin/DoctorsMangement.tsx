"use client";
import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import DoctorsStats from "./DoctorsStats";
import DoctorsFilters from "./DoctorsFilters";
import DoctorsTable from "./DoctorsTable";
import DoctorDetailModal from "./DoctorDetailModal";
import EditDoctorModal from "./EditDoctorModal";
import EmailCommunication from "../EmailCommunication";
import { Download, Mail } from "lucide-react";

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
  const [selectedDoctors, setSelectedDoctors] = useState<Doctor[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/doctors/manage`);
      const result = await response.json();

      if (response.ok) {
        const list = result.doctors ?? result;
        setDoctors(list);
        toast.success(`Loaded ${list.length} doctors successfully`, {
          duration: 2000,
        });
      } else {
        toast.error(result.message || "Failed to fetch doctors", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Error fetching doctors. Please check your connection.", {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorDetails = async (doctorId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/doctors/manage/${doctorId}`);
      const result = await response.json();
      if (response.ok) return result.doctor ?? result;
      toast.error(result.message || "Failed to fetch doctor details", {
        duration: 4000,
      });
      return null;
    } catch (error) {
      console.error("Error fetching doctor details:", error);
      toast.error("Error fetching doctor details", {
        duration: 4000,
      });
      return null;
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleViewDoctor = async (doctor: Doctor) => {
    const doctorDetails = await fetchDoctorDetails(doctor._id);
    if (doctorDetails) setViewingDoctor(doctorDetails);
  };

  const handleEditDoctor = async (doctor: Doctor) => {
    const doctorDetails = await fetchDoctorDetails(doctor._id);
    if (doctorDetails) setEditingDoctor(doctorDetails);
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    
    const loadingToast = toast.loading("Deleting doctor...");
    
    try {
      const response = await fetch(`${API_URL}/api/doctors/manage/${doctorId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDoctors(prev => prev.filter(d => d._id !== doctorId));
        setSelectedDoctors(prev => prev.filter(d => d._id !== doctorId));
        toast.success("Doctor deleted successfully!", {
          id: loadingToast,
          duration: 3000,
        });
      } else {
        const r = await response.json().catch(() => ({}));
        throw new Error(r.message || "Failed to delete doctor");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete doctor", {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleUpdateDoctor = async (doctorId: string, updatedData: any) => {
    const loadingToast = toast.loading("Updating doctor...");
    
    try {
      const response = await fetch(`${API_URL}/api/doctors/manage/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (response.ok) {
        const updated = result.doctor ?? result;
        setDoctors(prev => prev.map(d => (d._id === doctorId ? { ...d, ...updated } : d)));
        setEditingDoctor(null);
        toast.success("Doctor updated successfully!", {
          id: loadingToast,
          duration: 3000,
        });
        return true;
      } else throw new Error(result.message || "Failed to update doctor");
    } catch (error: any) {
      toast.error(error.message || "Failed to update doctor", {
        id: loadingToast,
        duration: 4000,
      });
      return false;
    }
  };

  const handleSendResetEmail = async (doctorId: string) => {
    if (!confirm("Send password reset email to this doctor?")) return;

    const loadingToast = toast.loading("Sending reset email...");

    try {
      const response = await fetch(`${API_URL}/api/doctors/email/send-reset-email/${doctorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Password reset email sent to ${result.doctorEmail || "doctor"}`, {
          id: loadingToast,
          duration: 3000,
        });
      } else {
        throw new Error(result.message || "Failed to send reset email");
      }
    } catch (error: any) {
      console.error("Reset email error:", error);
      toast.error(error.message || "Failed to send reset email", {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleSendCommunication = async (subject: string, message: string) => {
    const doctorIds = selectedDoctors.map(doctor => doctor._id);
    const loadingToast = toast.loading("Sending communication...");
    
    try {
      const response = await fetch(`${API_URL}/api/doctors/email/send-communication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorIds, subject, message }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message || "Communication sent successfully", {
          id: loadingToast,
          duration: 3000,
        });
        setSelectedDoctors([]);
        setIsEmailModalOpen(false);
      } else throw new Error(result.message || "Failed to send communication");
    } catch (error: any) {
      toast.error(error.message || "Failed to send communication", {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    const isSelected = selectedDoctors.some(d => d._id === doctor._id);
    setSelectedDoctors(isSelected ? selectedDoctors.filter(d => d._id !== doctor._id) : [...selectedDoctors, doctor]);
  };

  const handleSelectAllDoctors = () => {
    const filteredDoctors = getFilteredDoctors();
    const allSelected = selectedDoctors.length === filteredDoctors.length;
    setSelectedDoctors(allSelected ? [] : filteredDoctors);
    
    if (!allSelected) {
      toast.success(`Selected ${filteredDoctors.length} doctors`, {
        duration: 2000,
      });
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
    
    toast.success(`Exported ${filteredDoctors.length} doctors to CSV`, {
      duration: 3000,
    });
  };

  const safeToString = (value: any): string => (value ? String(value).toLowerCase() : "");
  const formatPhoneNumber = (phone: string | number): string => (phone ? String(phone) : "N/A");

  const getSpecializationDisplayName = (specialization: string) => {
    const names: Record<string, string> = {
      "general-practice": "General Practice",
      endocrinology: "Endocrinology",
      cardiology: "Cardiology",
      nephrology: "Nephrology",
      "internal-medicine": "Internal Medicine",
      other: "Other",
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
        !filterSpecialization || safeToString(doctor.specialization) === safeToString(filterSpecialization);

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
    <>
      {/* Toast Container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              border: '1px solid #86efac',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#fef2f2',
              border: '1px solid #fca5a5',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            style: {
              background: '#eff6ff',
              border: '1px solid #93c5fd',
            },
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctors Management</h1>
            <p className="text-gray-600">Manage and view all registered medical professionals</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            {selectedDoctors.length > 0 && (
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail size={18} className="mr-2" />
                Email ({selectedDoctors.length})
              </button>
            )}
            <button
              onClick={exportDoctors}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <DoctorsStats doctors={doctors} filteredDoctors={filteredDoctors} />
        <DoctorsFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterSpecialization={filterSpecialization}
          setFilterSpecialization={setFilterSpecialization}
          filterCondition={filterCondition}
          setFilterCondition={setFilterCondition}
        />
        <DoctorsTable
          doctors={filteredDoctors}
          selectedDoctors={selectedDoctors}
          onViewDoctor={handleViewDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          onSendResetEmail={handleSendResetEmail}
          onSelectDoctor={handleSelectDoctor}
          onSelectAllDoctors={handleSelectAllDoctors}
          formatPhoneNumber={formatPhoneNumber}
          getSpecializationDisplayName={getSpecializationDisplayName}
        />

        {viewingDoctor && (
          <DoctorDetailModal
            doctor={viewingDoctor}
            onClose={() => setViewingDoctor(null)}
            onEdit={() => {
              setViewingDoctor(null);
              handleEditDoctor(viewingDoctor);
            }}
            onSendResetEmail={() => handleSendResetEmail(viewingDoctor._id)}
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

        {isEmailModalOpen && (
          <EmailCommunication
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            selectedDoctors={selectedDoctors}
            onSendCommunication={handleSendCommunication}
          />
        )}
      </div>
    </>
  );
};

export default DoctorsManagement;