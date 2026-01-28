"use client";
import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";
import StatsCard from "../components/admin/StatsCard";
import React, { useState, useEffect } from "react";
import { 
  BriefcaseMedical, 
  UsersRound, 
  Activity,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

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

interface ApprovalStatistics {
  totalPatients: number;
  approvedPatients: number;
  pendingApprovals: number;
  approvalRate: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [approvalStats, setApprovalStats] = useState<ApprovalStatistics>({
    totalPatients: 0,
    approvedPatients: 0,
    pendingApprovals: 0,
    approvalRate: '0'
  });

  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
    fetchStatistics();
    fetchApprovalStatistics();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/doctors/manage`, {
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

      const result = await response.json();

      if (response.ok) {
        const list = result.doctors ?? result;
        setDoctors(list);
      } else {
        toast.error(result.message || "Failed to fetch doctors", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError("Failed to load dashboard data");
      toast.error("Error fetching doctors. Please check your connection.", {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/statistics`, {
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

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } else {
        toast.error("Failed to fetch statistics", { duration: 4000 });
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
      toast.error("Failed to fetch statistics", { duration: 4000 });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchApprovalStatistics = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/approval-statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApprovalStats(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching approval statistics:", err);
    }
  };

  const refreshData = () => {
    fetchDoctors();
    fetchStatistics();
    fetchApprovalStatistics();
    toast.success("Dashboard refreshed", { duration: 2000 });
  };

  // Calculate percentages and insights
  const diabetesPercentage = stats.totalPatients > 0 
    ? Math.round((stats.diabetesCount / stats.totalPatients) * 100) 
    : 0;
  
  const hypertensionPercentage = stats.totalPatients > 0 
    ? Math.round((stats.hypertensionCount / stats.totalPatients) * 100) 
    : 0;

  const activeRelativesPercentage = stats.totalRelatives > 0
    ? Math.round((stats.activeRelatives / stats.totalRelatives) * 100)
    : 0;

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-row">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-row">
      <Toaster position="top-right" />
      
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main Dashboard Content */}
        <div className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 mt-1">Monitor your healthcare system at a glance</p>
            </div>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh Data
            </button>
          </div>

          {/* Pending Approvals Alert */}
          {approvalStats.pendingApprovals > 0 && (
            <div 
              onClick={() => router.push('/admin/pending-approvals')}
              className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">
                    {approvalStats.pendingApprovals} Patient{approvalStats.pendingApprovals !== 1 ? 's' : ''} Awaiting Approval
                  </h3>
                  <p className="text-sm text-amber-700">
                    Click here to review and approve new patient registrations
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors">
                Review Now →
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Primary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Doctors"
              value={doctors.length}
              icon={<BriefcaseMedical />}
              bgColor="bg-emerald-100"
            />
            <StatsCard
              title="Active Patients"
              value={approvalStats.approvedPatients}
              icon={<UsersRound />}
              bgColor="bg-purple-100"
            />
            <div 
              onClick={() => router.push('/admin/pending-approvals')}
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <StatsCard
                title="Pending Approvals"
                value={approvalStats.pendingApprovals}
                icon={<UserCheck />}
                bgColor={approvalStats.pendingApprovals > 0 ? "bg-amber-100" : "bg-green-100"}
              />
            </div>
            <StatsCard
              title="Family Members"
              value={stats.totalRelatives}
              icon={<Users />}
              bgColor="bg-blue-100"
            />
          </div>

          {/* Approval Overview Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Patient Approval Overview</h3>
              <button
                onClick={() => router.push('/admin/pending-approvals')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Details →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Registrations */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Registered</p>
                  <p className="text-2xl font-bold text-gray-900">{approvalStats.totalPatients}</p>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </div>
              </div>

              {/* Approved */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{approvalStats.approvedPatients}</p>
                  <p className="text-xs text-gray-500 mt-1">Active accounts</p>
                </div>
              </div>

              {/* Pending */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{approvalStats.pendingApprovals}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
                </div>
              </div>

              {/* Approval Rate */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{approvalStats.approvalRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Success rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Conditions Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Diabetes Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Diabetes Patients</h3>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.diabetesCount}</span>
                    <span className="text-sm font-medium text-gray-600">{diabetesPercentage}% of patients</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${diabetesPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Patients with diabetes diagnosis requiring ongoing monitoring
                </p>
              </div>
            </div>

            {/* Hypertension Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hypertension Patients</h3>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.hypertensionCount}</span>
                    <span className="text-sm font-medium text-gray-600">{hypertensionPercentage}% of patients</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${hypertensionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Patients with hypertension requiring blood pressure management
                </p>
              </div>
            </div>
          </div>

          {/* Family Members Status */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Member Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Relatives */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeRelatives}</p>
                  <p className="text-xs text-gray-500 mt-1">{activeRelativesPercentage}% of total</p>
                </div>
              </div>

              {/* Pending Invitations */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRelatives}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
                </div>
              </div>

              {/* Completed Profiles */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Profiles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedRelativeProfiles}</p>
                  <p className="text-xs text-gray-500 mt-1">Full access granted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/admin/pending-approvals')}
                className="p-4 border-2 border-amber-200 bg-amber-50 rounded-lg hover:border-amber-500 hover:bg-amber-100 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <UserCheck className="w-8 h-8 text-amber-600" />
                  {approvalStats.pendingApprovals > 0 && (
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      {approvalStats.pendingApprovals}
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-amber-700">Pending Approvals</h4>
                <p className="text-sm text-gray-600 mt-1">Review new patient registrations</p>
              </button>

              <button
                onClick={() => router.push('/admin/doctors')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <BriefcaseMedical className="w-8 h-8 text-emerald-600 mb-2" />
                <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700">Manage Doctors</h4>
                <p className="text-sm text-gray-600 mt-1">Add, edit, or remove healthcare providers</p>
              </button>

              <button
                onClick={() => router.push('/admin/patients')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
              >
                <UsersRound className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="font-semibold text-gray-900 group-hover:text-purple-700">Manage Patients</h4>
                <p className="text-sm text-gray-600 mt-1">View and manage patient records</p>
              </button>

              <button
                onClick={() => router.push('/admin/patients')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">Family Members</h4>
                <p className="text-sm text-gray-600 mt-1">Grant and manage family access</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}