"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DoctorManagement from "./DoctorManagement";
import { 
  User, 
  Stethoscope, 
  X, 
  Calendar,
  Activity,
  AlertCircle,
  RefreshCw,
  Plus,
  Shield,
  Clock
} from "lucide-react";

interface UserProfile {
  _id: string;
  fullName: string;
  firstname: string;
  lastname: string;
  dob: string;
  gender: string;
  weight: number;
  height: number;
  picture?: string;
  phoneNumber: string;
  relationship: string;
  diabetes: boolean;
  hypertension: boolean;
  cardiovascular: boolean;
  allergies?: string;
  surgeries?: string;
  age?: number;
}

interface UserProfileHeaderProps {
  onDoctorsToggle?: (show: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ onDoctorsToggle }) => {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDoctors, setShowDoctors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = useCallback((): string | null => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("token") || sessionStorage.getItem("token");
      }
      return null;
    } catch (error) {
      console.error("Error accessing storage:", error);
      return null;
    }
  }, []);

  const calculateAge = useCallback((dob: string): number => {
    try {
      const today = new Date();
      const birthDate = new Date(dob);
      
      if (isNaN(birthDate.getTime())) {
        console.warn("Invalid date of birth:", dob);
        return 0;
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error("Error calculating age:", error);
      return 0;
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const profileData = result.data;
        const age = profileData.dob ? calculateAge(profileData.dob) : undefined;
        setUserProfile({ ...profileData, age });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, calculateAge]);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && showDoctors) {
      handleShowDoctors();
    }
  }, [showDoctors]);

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleShowDoctors();
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (showDoctors) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showDoctors, handleEscapeKey]);

  const handleViewProfile = () => {
    router.push("/profile?step=5");
  };

  const handleShowDoctors = () => {
    const newShowDoctors = !showDoctors;
    setShowDoctors(newShowDoctors);
    if (onDoctorsToggle) {
      onDoctorsToggle(newShowDoctors);
    }
  };

  const handleRetry = () => {
    fetchUserProfile();
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-950/10 via-cyan-950/10 to-blue-950/5 border-b shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-800 to-cyan-600 rounded-full animate-pulse" />
              <div className="flex items-center gap-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-blue-800 to-cyan-600 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gradient-to-r from-blue-800 to-cyan-600 rounded w-40 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gradient-to-r from-blue-800 to-cyan-600 rounded w-28 animate-pulse" />
              <div className="h-8 bg-gradient-to-r from-blue-800 to-cyan-600 rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userProfile) {
    return (
      <div className="bg-gradient-to-r from-blue-950/10 via-cyan-950/10 to-blue-950/5 border-b shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Profile Error</h3>
                <p className="text-xs text-gray-600 mt-1">{error}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="bg-gradient-to-r from-cyan-600 to-blue-800 text-white px-3 py-2 rounded-lg hover:from-cyan-700 hover:to-blue-900 transition-all duration-200 font-medium shadow-sm flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
              <button
                onClick={handleViewProfile}
                className="bg-gradient-to-r from-blue-800 to-cyan-600 text-white px-3 py-2 rounded-lg hover:from-blue-900 hover:to-cyan-700 transition-all duration-200 font-medium shadow-sm flex items-center gap-2 text-sm"
              >
                <User className="w-3 h-3" />
                Create Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No profile state
  if (!userProfile) {
    return (
      <div className="bg-gradient-to-r from-blue-950/10 via-cyan-950/10 to-blue-950/5 border-b shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-800 to-cyan-600 rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">No Profile Found</h3>
                <p className="text-xs text-gray-600 mt-1">Complete your profile to get started</p>
              </div>
            </div>
            <button
              onClick={handleViewProfile}
              className="bg-gradient-to-r from-cyan-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:from-cyan-700 hover:to-blue-900 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
            >
              <User className="w-3 h-3" />
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const healthConditions = [];
  if (userProfile.diabetes) healthConditions.push("Diabetes");
  if (userProfile.hypertension) healthConditions.push("Hypertension");
  if (userProfile.cardiovascular) healthConditions.push("Cardiovascular");

  return (
    <div className="bg-gradient-to-r from-blue-950/10 via-cyan-950/10 to-blue-950/5 border-b shadow-sm">
      {/* Header Section */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - User info */}
          <div className="flex items-center gap-4">
            {/* Profile picture */}
            {userProfile.picture ? (
              <img
                src={userProfile.picture}
                alt={`${userProfile.fullName}'s profile`}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-800 to-cyan-600 flex items-center justify-center shadow-md border-2 border-white">
                <User className="w-5 h-5 text-white" />
              </div>
            )}

            {/* User details */}
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {userProfile.fullName}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-700 mt-1">
                  <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                    <Calendar className="w-3 h-3 text-blue-800" />
                    <span className="font-semibold text-blue-900">{userProfile.age || "N/A"}</span>
                    <span className="text-blue-800">yrs</span>
                  </div>
                  <div className="flex items-center gap-1 bg-cyan-100 px-2 py-1 rounded-lg">
                    <Activity className="w-3 h-3 text-cyan-700" />
                    <span className="font-semibold text-cyan-800">{userProfile.weight || "N/A"}</span>
                    <span className="text-cyan-700">kg</span>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                    <Activity className="w-3 h-3 text-blue-800" />
                    <span className="font-semibold text-blue-900">{userProfile.height || "N/A"}</span>
                    <span className="text-blue-800">cm</span>
                  </div>
                </div>
              </div>

              {/* Health conditions */}
              {healthConditions.length > 0 && (
                <div className="flex gap-2">
                  {healthConditions.map((condition) => (
                    <span
                      key={condition}
                      className="px-2 py-1 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 text-xs font-semibold rounded-full border border-red-200 shadow-sm flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      {condition}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Buttons */}
          <div className="flex items-center gap-3">
            {/* Doctor Management Button */}
            <button
              onClick={handleShowDoctors}
              className={`px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold flex items-center gap-2 shadow-lg ${
                showDoctors 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-800 text-white transform scale-105 shadow-xl' 
                  : 'bg-gradient-to-r from-blue-800 to-cyan-600 text-white hover:from-blue-900 hover:to-cyan-700 hover:shadow-xl hover:transform hover:-translate-y-0.5'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showDoctors ? 'Managing Doctors' : 'Manage Doctors'}
              </span>
            </button>

            {/* View Profile Button */}
            <button
              onClick={handleViewProfile}
              className="bg-gradient-to-r from-cyan-600 to-blue-800 text-white px-4 py-2.5 rounded-xl hover:from-cyan-700 hover:to-blue-900 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:transform hover:-translate-y-0.5 text-sm"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">View Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Doctor Management Modal */}
      {showDoctors && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col transform scale-100">
            {/* Enhanced Modal Header */}
            <div className="flex justify-between items-center p-8 border-b border-gray-200 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold">Doctor Management</h3>
                  <p className="text-blue-100 text-lg mt-1">
                    Manage your healthcare providers, appointments, and medical team
                  </p>
                </div>
              </div>
              <button
                onClick={handleShowDoctors}
                className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                aria-label="Close doctor management"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Enhanced Modal Content */}
            <div className="flex-1 overflow-y-auto p-0 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="p-8">
                <DoctorManagement condition="diabetes" />
              </div>
            </div>
            
            {/* Enhanced Modal Footer */}
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-blue-100 to-cyan-100">
              <div className="flex justify-between items-center">
                <div className="text-sm text-cyan-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <p>Your healthcare team is important for managing your condition</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleShowDoctors}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Add functionality to add new doctor
                      console.log("Add new doctor clicked");
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-800 text-white rounded-xl hover:from-cyan-700 hover:to-blue-900 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Doctor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileHeader;