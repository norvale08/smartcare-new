// components/admin/DoctorsManagement.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import { 
  Users, Search, Filter, Edit, Trash2, 
  Mail, Phone, Building, Stethoscope,
  Eye, MoreVertical, Download, Plus,
  Heart, Activity
} from "lucide-react";

type Doctor = {
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

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialization = 
      !filterSpecialization || doctor.specialization === filterSpecialization;

    const matchesCondition = 
      !filterCondition || 
      (filterCondition === "diabetes" && doctor.diabetes) ||
      (filterCondition === "hypertension" && doctor.hypertension);

    return matchesSearch && matchesSpecialization && matchesCondition;
  });

  const deleteDoctor = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      return;
    }

    try {
      // You'll need to implement this endpoint in your backend
      const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove doctor from local state
        setDoctors(doctors.filter(d => d._id !== doctorId));
        alert("Doctor deleted successfully!");
      } else {
        throw new Error("Failed to delete doctor");
      }
    } catch (error) {
      alert("Failed to delete doctor. Please try again.");
    }
  };

  const exportDoctors = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Specialization", "License", "Hospital", "Treats Diabetes", "Treats Hypertension", "Registered Date"],
      ...filteredDoctors.map(doctor => [
        `${doctor.firstName} ${doctor.lastName}`,
        doctor.email,
        doctor.phoneNumber,
        doctor.specialization,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <Button
            onClick={exportDoctors}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download size={18} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{doctors.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Diabetes Specialists</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {doctors.filter(d => d.diabetes).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hypertension Specialists</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {doctors.filter(d => d.hypertension).length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Heart className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Showing</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredDoctors.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Filter className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Doctors
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                id="search"
                placeholder="Search by name, email, license, or hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Specialization Filter */}
          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <select
              id="specialization"
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Specializations</option>
              <option value="general-practice">General Practice</option>
              <option value="endocrinology">Endocrinology</option>
              <option value="cardiology">Cardiology</option>
              <option value="nephrology">Nephrology</option>
              <option value="internal-medicine">Internal Medicine</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              id="condition"
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Conditions</option>
              <option value="diabetes">Diabetes</option>
              <option value="hypertension">Hypertension</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
            <p className="mt-2 text-gray-500">
              {doctors.length === 0 
                ? "No doctors have been registered yet." 
                : "No doctors match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Doctor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Specialization</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hospital</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Conditions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">License</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {doctor.firstName} {doctor.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Registered {new Date(doctor.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {doctor.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          {doctor.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Stethoscope size={14} className="mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {getSpecializationDisplayName(doctor.specialization)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building size={14} className="mr-2 text-gray-400" />
                        {doctor.hospital}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {doctor.diabetes && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Activity size={12} className="mr-1" />
                            Diabetes
                          </span>
                        )}
                        {doctor.hypertension && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Heart size={12} className="mr-1" />
                            Hypertension
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {doctor.licenseNumber}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => deleteDoctor(doctor._id)}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsManagement;