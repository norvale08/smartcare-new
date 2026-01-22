// patients/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Patient {
  _id: string;
  fullName: string;
  firstname: string; // Emergency contact first name
  lastname: string; // Emergency contact last name
  email: string; // ✅ Emergency contact email
  phoneNumber: string; // Emergency contact phone number
  relationship: string; // Emergency contact relationship
  dob: string;
  gender: string;
  weight: number;
  height: number;
  diabetes: boolean;
  hypertension: boolean;
  picture: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Patient's actual contact info from User model
  patientEmail: string;
  patientPhone: string;
  patientFirstName: string;
  patientLastName: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPatients: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Statistics {
  totalPatients: number;
  totalUsers: number;
  diabetesCount: number;
  hypertensionCount: number;
  totalRelatives: number;
  pendingRelatives: number;
  activeRelatives: number;
  completedRelativeProfiles: number;
}

interface Relative {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  invitationStatus: string;
  invitationExpires: string;
  profileCompleted: boolean;
  accessLevel: string;
  patientName: string;
  patientEmail: string;
  relationship: string;
  createdAt: string;
}

// ✅ FIXED: Changed from 3001 to 8000 to match backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [loading, setLoading] = useState(true);
  const [relativesLoading, setRelativesLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRelative, setSelectedRelative] = useState<Relative | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCreateRelativeModal, setShowCreateRelativeModal] = useState(false);
  const [showRelativesModal, setShowRelativesModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [creatingRelative, setCreatingRelative] = useState(false);
  const [resendingInvitation, setResendingInvitation] = useState(false);
  const [activeTab, setActiveTab] = useState("patients"); // "patients" or "relatives"
  const [selectedAccessLevel, setSelectedAccessLevel] = useState("view_only");

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalPatients: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [relativesPagination, setRelativesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRelatives: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [stats, setStats] = useState<Statistics>({
    totalPatients: 0,
    totalUsers: 0,
    diabetesCount: 0,
    hypertensionCount: 0,
    totalRelatives: 0,
    pendingRelatives: 0,
    activeRelatives: 0,
    completedRelativeProfiles: 0,
  });

  const router = useRouter();

  useEffect(() => {
    fetchPatients();
    fetchStatistics();
  }, []);

  const fetchPatients = async (page = 1, search = searchTerm, disease = diseaseFilter) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(disease !== "all" && { disease }),
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/patients?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setError("Access denied. Admin rights required.");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPatients(data.data.patients);
        setPagination(data.data.pagination);
        if (data.data.statistics) {
          setStats(prev => ({
            ...prev,
            ...data.data.statistics
          }));
        }
        setError("");
      } else {
        setError(data.message || "Failed to fetch patients");
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to connect to server. Please check if the API is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatives = async (page = 1, status = "") => {
    try {
      setRelativesLoading(true);
      const token = localStorage.getItem("token");

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(status && { status }),
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/relatives?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRelatives(data.data.relatives);
          setRelativesPagination(data.data.pagination);
        }
      }
    } catch (err) {
      console.error("Error fetching relatives:", err);
    } finally {
      setRelativesLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSearch = searchTerm.trim();

    if (activeTab === "patients") {
    fetchPatients(1, cleanSearch, diseaseFilter);
  }
  };

  const handleDiseaseFilterChange = (disease: string) => {
    setDiseaseFilter(disease);
    fetchPatients(1, searchTerm, disease);
  };

  const handlePageChange = (newPage: number) => {
    if (activeTab === "patients") {
      fetchPatients(newPage, searchTerm, diseaseFilter);
    } else {
      fetchRelatives(newPage);
    }
  };

  const handleRelativesPageChange = (newPage: number) => {
    fetchRelatives(newPage);
  };

  const showContactInfo = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowContactModal(true);
  };

  const handleCreateRelativeAccount = async () => {
    if (!selectedPatient) return;

    try {
      setCreatingRelative(true);
      const token = localStorage.getItem("token");

      // Validate email exists
      if (!selectedPatient.email) {
        setError("Emergency contact email is required to create a relative account");
        setCreatingRelative(false);
        return;
      }

      const requestBody = {
        patientId: selectedPatient._id,
        emergencyContactEmail: selectedPatient.email,
        accessLevel: selectedAccessLevel,
        adminNotes: `Relative account created by admin for ${getPatientFullName(selectedPatient)}`
      };

      console.log("📤 Sending request to create relative account:", requestBody);

      const response = await fetch(`${API_BASE_URL}/api/admin/create-relative-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log("📥 Response from create relative account:", data);

      if (data.success) {
        setSuccessMessage(data.message);
        setShowCreateRelativeModal(false);
        setShowContactModal(false);

        // Refresh data
        fetchStatistics();
        fetchRelatives(1);

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setError(data.message || "Failed to create relative account");
      }
    } catch (err) {
      console.error("❌ Error creating relative account:", err);
      setError("Failed to create relative account. Please check the console for details.");
    } finally {
      setCreatingRelative(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!selectedRelative) return;

    try {
      setResendingInvitation(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/admin/resend-relative-invitation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          relativeId: selectedRelative._id
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        setShowResendModal(false);
        fetchRelatives(relativesPagination.currentPage);

        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setError(data.message || "Failed to resend invitation");
      }
    } catch (err) {
      console.error("Error resending invitation:", err);
      setError("Failed to resend invitation");
    } finally {
      setResendingInvitation(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid date";
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "N/A";
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch {
      return "N/A";
    }
  };

  const formatRelationship = (relationship: string) => {
    const relationshipMap: { [key: string]: string } = {
      'parent': 'Parent',
      'sibling': 'Sibling',
      'spouse': 'Spouse',
      'friend': 'Friend',
      'other': 'Other'
    };
    return relationshipMap[relationship] || relationship;
  };

  const getEmergencyContactName = (patient: Patient) => {
    return `${patient.firstname} ${patient.lastname}`.trim();
  };

  const getPatientFullName = (patient: Patient) => {
    if (patient.patientFirstName && patient.patientLastName) {
      return `${patient.patientFirstName} ${patient.patientLastName}`;
    }
    return patient.fullName;
  };

  const getRelativeFullName = (relative: Relative) => {
    return `${relative.firstName} ${relative.lastName}`.trim();
  };

  const getInvitationStatusBadge = (status: string, expires: string) => {
    const now = new Date();
    const expiryDate = new Date(expires);

    if (status === "accepted") {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
    }

    if (status === "pending") {
      if (expiryDate < now) {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
      }
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }

    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
  };

  const getAccessLevelBadge = (level: string) => {
    const levelMap: { [key: string]: { bg: string, text: string, label: string } } = {
      'view_only': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'View Only' },
      'caretaker': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Caretaker' },
      'emergency_only': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Emergency' }
    };

    const badge = levelMap[level] || { bg: 'bg-gray-100', text: 'text-gray-800', label: level };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // CSV Download Function
  const downloadCSV = async () => {
    try {
      setDownloadingCSV(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const queryParams = new URLSearchParams({
        limit: "1000",
        ...(searchTerm && { search: searchTerm }),
        ...(diseaseFilter !== "all" && { disease: diseaseFilter }),
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/patients?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const patientsData = data.data.patients;

        const headers = [
          'Patient Name',
          'Patient Email',
          'Patient Phone',
          'Age',
          'Gender',
          'Diabetes',
          'Hypertension',
          'Emergency Contact Name',
          'Emergency Contact Email',
          'Emergency Contact Relationship',
          'Emergency Contact Phone',
          'Registration Date'
        ];

        const csvRows = patientsData.map((patient: Patient) => [
          `"${getPatientFullName(patient)}"`,
          `"${patient.patientEmail}"`,
          `"${patient.patientPhone}"`,
          `"${patient.dob ? calculateAge(patient.dob) + ' years' : 'N/A'}"`,
          `"${patient.gender || 'N/A'}"`,
          `"${patient.diabetes ? 'Yes' : 'No'}"`,
          `"${patient.hypertension ? 'Yes' : 'No'}"`,
          `"${getEmergencyContactName(patient)}"`,
          `"${patient.email || 'N/A'}"`,
          `"${formatRelationship(patient.relationship)}"`,
          `"${patient.phoneNumber}"`,
          `"${formatDate(patient.createdAt)}"`
        ]);

        const csvContent = [
          headers.join(','),
          ...csvRows.map((row: string[]) => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `patients_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setError("");
      } else {
        setError("Failed to download patient data");
      }
    } catch (err) {
      console.error("Error downloading CSV:", err);
      setError("Failed to download CSV file");
    } finally {
      setDownloadingCSV(false);
    }
  };

  const downloadRelativesCSV = async () => {
    try {
      setDownloadingCSV(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/admin/relatives?limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          const relativesData = data.data.relatives;

          const headers = [
            'Relative Name',
            'Relative Email',
            'Relationship',
            'Patient Name',
            'Patient Email',
            'Access Level',
            'Invitation Status',
            'Invitation Expires',
            'Profile Completed',
            'Created Date'
          ];

          const csvRows = relativesData.map((relative: Relative) => [
            `"${getRelativeFullName(relative)}"`,
            `"${relative.email}"`,
            `"${relative.relationship || 'N/A'}"`,
            `"${relative.patientName || 'N/A'}"`,
            `"${relative.patientEmail || 'N/A'}"`,
            `"${relative.accessLevel || 'view_only'}"`,
            `"${relative.invitationStatus}"`,
            `"${formatDateTime(relative.invitationExpires)}"`,
            `"${relative.profileCompleted ? 'Yes' : 'No'}"`,
            `"${formatDate(relative.createdAt)}"`
          ]);

          const csvContent = [
            headers.join(','),
            ...csvRows.map((row: string[]) => row.join(','))
          ].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `relatives_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.error("Error downloading relatives CSV:", err);
      setError("Failed to download relatives CSV");
    } finally {
      setDownloadingCSV(false);
    }
  };

  if (loading && patients.length === 0 && activeTab === "patients") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage patients and family member access</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("patients")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "patients"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Patients
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
                {stats.totalPatients}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("relatives");
                fetchRelatives();
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "relatives"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Family Members
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
                {stats.totalRelatives}
              </span>
            </button>
          </nav>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Diabetes Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.diabetesCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hypertension Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hypertensionCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Family Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRelatives}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {stats.pendingRelatives > 0 && (
                    <span className="text-xs text-orange-600">
                      {stats.pendingRelatives} pending
                    </span>
                  )}
                  {stats.activeRelatives > 0 && (
                    <span className="text-xs text-green-600">
                      {stats.activeRelatives} active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "patients" ? (
          <>
            {/* Filters and Search for Patients */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-4 flex-1 w-full lg:w-auto">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search patients by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Search
                  </button>
                </form>

                <div className="flex gap-2">
                  <select
                    value={diseaseFilter}
                    onChange={(e) => handleDiseaseFilterChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Conditions</option>
                    <option value="diabetes">Diabetes Only</option>
                    <option value="hypertension">Hypertension Only</option>
                  </select>

                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setDiseaseFilter("all");
                      fetchPatients(1, "", "all");
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>

                  <button
                    onClick={downloadCSV}
                    disabled={downloadingCSV || patients.length === 0}
                    className={`px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 ${downloadingCSV || patients.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {downloadingCSV ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m8-10h-4M6 12H2m16.364-6.364l-2.828 2.828M7.464 17.536l-2.828 2.828m0-11.314l2.828 2.828m11.314 0l2.828 2.828" />
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emergency Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age/Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conditions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emergency Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getPatientFullName(patient)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.patientEmail}</div>
                          <div className="text-sm text-gray-500">{patient.patientPhone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.email || (
                              <span className="text-gray-400 italic">No email</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.dob ? calculateAge(patient.dob) + " years" : "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {patient.gender || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {patient.diabetes && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Diabetes
                              </span>
                            )}
                            {patient.hypertension && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Hypertension
                              </span>
                            )}
                            {!patient.diabetes && !patient.hypertension && (
                              <span className="text-xs text-gray-500">No conditions</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getEmergencyContactName(patient)}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {formatRelationship(patient.relationship)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(patient.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => showContactInfo(patient)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                          >
                            View Details
                          </button>
                          {patient.email && (
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowCreateRelativeModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                            >
                              Grant Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {patients.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || diseaseFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "No patients have been registered yet"}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination for Patients */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages} •{" "}
                  {pagination.totalPatients} total patients
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium ${pagination.hasPrev
                        ? "text-gray-700 bg-white hover:bg-gray-50"
                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                      }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium ${pagination.hasNext
                        ? "text-gray-700 bg-white hover:bg-gray-50"
                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Relatives Tab Content */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Family Member Accounts</h3>
                <div className="flex gap-2">
                  <button
                    onClick={downloadRelativesCSV}
                    disabled={downloadingCSV || relatives.length === 0}
                    className={`px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 ${downloadingCSV || relatives.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {downloadingCSV ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m8-10h-4M6 12H2m16.364-6.364l-2.828 2.828M7.464 17.536l-2.828 2.828m0-11.314l2.828 2.828m11.314 0l2.828 2.828" />
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Relatives Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Family Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Relationship
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Access Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {relativesLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : relatives.map((relative) => (
                      <tr key={relative._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getRelativeFullName(relative)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{relative.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{relative.patientName}</div>
                          <div className="text-sm text-gray-500">{relative.patientEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {relative.relationship || "Not specified"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAccessLevelBadge(relative.accessLevel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getInvitationStatusBadge(relative.invitationStatus, relative.invitationExpires)}
                          {relative.profileCompleted && (
                            <div className="text-xs text-green-600 mt-1">Profile Completed</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(relative.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {relative.invitationStatus === "pending" && (
                            <button
                              onClick={() => {
                                setSelectedRelative(relative);
                                setShowResendModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                            >
                              Resend Invite
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State for Relatives */}
              {relatives.length === 0 && !relativesLoading && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No family member accounts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Grant access to emergency contacts to create family member accounts
                  </p>
                </div>
              )}
            </div>

            {/* Pagination for Relatives */}
            {relativesPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing page {relativesPagination.currentPage} of {relativesPagination.totalPages} •{" "}
                  {relativesPagination.totalRelatives} total family members
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRelativesPageChange(relativesPagination.currentPage - 1)}
                    disabled={!relativesPagination.hasPrev}
                    className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium ${relativesPagination.hasPrev
                        ? "text-gray-700 bg-white hover:bg-gray-50"
                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                      }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleRelativesPageChange(relativesPagination.currentPage + 1)}
                    disabled={!relativesPagination.hasNext}
                    className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium ${relativesPagination.hasNext
                        ? "text-gray-700 bg-white hover:bg-gray-50"
                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Information Modal */}
      {showContactModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Fixed Profile Section */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                {selectedPatient.picture ? (
                  <img
                    src={selectedPatient.picture}
                    alt={getPatientFullName(selectedPatient)}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {getPatientFullName(selectedPatient)?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getPatientFullName(selectedPatient)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {calculateAge(selectedPatient.dob)} years • {selectedPatient.gender}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Patient Contact Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Patient Contact</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Email Address</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatient.patientEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatient.patientPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getEmergencyContactName(selectedPatient)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Email Address</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatient.email || "No email provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Relationship</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {formatRelationship(selectedPatient.relationship)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatient.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedPatient.diabetes && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Diabetes
                    </span>
                  )}
                  {selectedPatient.hypertension && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Hypertension
                    </span>
                  )}
                  {!selectedPatient.diabetes && !selectedPatient.hypertension && (
                    <span className="text-sm text-gray-500">No medical conditions</span>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              {selectedPatient.email && (
                <button
                  onClick={() => {
                    setShowCreateRelativeModal(true);
                    setShowContactModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Grant Family Access
                </button>
              )}
              <button
                onClick={() => {
                  window.open(`tel:${selectedPatient.patientPhone}`, '_blank');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Patient
              </button>
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Relative Account Modal */}
      {showCreateRelativeModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Grant Family Member Access
              </h3>
              <button
                onClick={() => setShowCreateRelativeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-yellow-800">
                      This will create an account for the emergency contact and send them an invitation email to set up their password.
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      <strong>Note:</strong> Only the family member will receive the email notification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Patient</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {getPatientFullName(selectedPatient)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Family Member</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-900">{getEmergencyContactName(selectedPatient)}</p>
                    <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                    <p className="text-sm text-gray-600 capitalize">{formatRelationship(selectedPatient.relationship)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Access Level</p>
                  <select
                    value={selectedAccessLevel}
                    onChange={(e) => setSelectedAccessLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="view_only">View Only (Can see health data)</option>
                    <option value="caretaker">Caretaker (Can message doctors)</option>
                    <option value="emergency_only">Emergency Only (Limited access)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    The family member will only be able to view this patient's data.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateRelativeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={creatingRelative}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRelativeAccount}
                disabled={creatingRelative}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingRelative ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m8-10h-4M6 12H2m16.364-6.364l-2.828 2.828M7.464 17.536l-2.828 2.828m0-11.314l2.828 2.828m11.314 0l2.828 2.828" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Invitation Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Invitation Modal */}
      {showResendModal && selectedRelative && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Resend Invitation Email
              </h3>
              <button
                onClick={() => setShowResendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-yellow-800">
                      This will send a new invitation email with a fresh setup link that expires in 7 days.
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      <strong>Note:</strong> Only the family member will receive the email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Family Member</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-900">{getRelativeFullName(selectedRelative)}</p>
                    <p className="text-sm text-gray-600">{selectedRelative.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Patient</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRelative.patientName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedRelative.patientEmail}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Current Status</p>
                  <div className="flex items-center space-x-2">
                    {getInvitationStatusBadge(selectedRelative.invitationStatus, selectedRelative.invitationExpires)}
                    <span className="text-sm text-gray-600">
                      Expires: {formatDateTime(selectedRelative.invitationExpires)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowResendModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={resendingInvitation}
              >
                Cancel
              </button>
              <button
                onClick={handleResendInvitation}
                disabled={resendingInvitation}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingInvitation ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m8-10h-4M6 12H2m16.364-6.364l-2.828 2.828M7.464 17.536l-2.828 2.828m0-11.314l2.828 2.828m11.314 0l2.828 2.828" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Resend to Family Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}