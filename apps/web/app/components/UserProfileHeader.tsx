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

  // Commented out BMI calculation function
  /*
  const calculateBMI = useCallback((weight: number, height: number): string => {
    if (!weight || !height || height === 0) return "N/A";
    
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  }, []);
  */

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
      <div className="w-full bg-cyan-100 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full animate-pulse" />
              <div className="space-y-2 hidden sm:block">
                <div className="h-4 bg-gray-300 rounded w-24 sm:w-32 animate-pulse" />
                <div className="h-3 bg-gray-300 rounded w-20 sm:w-24 animate-pulse" />
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-9 bg-gray-300 rounded-lg w-20 animate-pulse" />
              <div className="h-9 bg-gray-300 rounded-lg w-20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userProfile) {
    return (
      <div className="w-full bg-cyan-100 border-b border-red-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-lg font-semibold text-gray-900">Profile Error</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
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
      <div className="w-full bg-cyan-100 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-lg font-semibold text-gray-900">No Profile Found</h3>
                <p className="text-sm text-gray-600">Complete your profile to get started</p>
              </div>
            </div>
            <button
              onClick={handleViewProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2 text-sm shadow-md hover:shadow-lg"
            >
              <User className="w-4 h-4" />
              <span>Create Profile</span>
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

  // BMI calculation commented out - variable no longer used
  // const bmi = calculateBMI(userProfile.weight, userProfile.height);

  return (
    <div className="w-full bg-gray-100 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* User Info Section */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Profile Picture */}
            {userProfile.picture ? (
              <img
                src={userProfile.picture}
                alt={`${userProfile.fullName}'s profile`}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-cyan-50 shadow-sm sm:shadow-md"
              />
            ) : (
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm sm:shadow-md">
                <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            )}

            {/* User Details - Different layout for mobile vs desktop */}
            <div className="min-w-0 flex-1">
              {/* Mobile Layout */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h1 className="text-base font-bold text-gray-900 truncate max-w-[120px]">
                      {userProfile.fullName}
                    </h1>
                    
                    {/* BMI badge removed from mobile view */}
                  </div>
                </div>
                
                {/* Health Conditions - below name on mobile */}
                {healthConditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {healthConditions.slice(0, 2).map((condition) => (
                      <span
                        key={condition}
                        className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200"
                      >
                        {condition}
                      </span>
                    ))}
                    {healthConditions.length > 2 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                        +{healthConditions.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:block">
                <div className="flex items-center space-x-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userProfile.fullName}
                  </h1>
                  {healthConditions.length > 0 && (
                    <div className="flex space-x-2 flex-wrap gap-1">
                      {healthConditions.map((condition) => (
                        <span
                          key={condition}
                          className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full border border-red-200"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Detailed stats - Only on desktop - BMI removed */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">{userProfile.age || "N/A"} years</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-cyan-50 px-3 py-1 rounded-full">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    <span className="font-medium text-cyan-700">{userProfile.weight || "N/A"} kg</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">{userProfile.height || "N/A"} cm</span>
                  </div>
                  {/* BMI stat removed */}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Always horizontal on all screen sizes */}
          <div className="flex items-center space-x-2 ml-3">
            {/* Manage Doctors Button */}
            <button
              onClick={handleShowDoctors}
              className={`px-3 py-2 rounded-lg transition-all duration-200 font-semibold flex items-center space-x-2 border text-sm ${
                showDoctors 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white shadow-md hover:shadow-lg'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden xs:inline">Doctors</span>
              <span className="xs:hidden">Dr</span>
            </button>

            {/* View Profile Button */}
            <button
              onClick={handleViewProfile}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold flex items-center space-x-2 text-sm shadow-md hover:shadow-lg"
            >
              <User className="w-4 h-4" />
              <span className="hidden xs:inline">Profile</span>
              <span className="xs:hidden">View</span>
            </button>
          </div>
        </div>

        {/* Minimal mobile stats - Only show on mobile - BMI removed */}
        <div className="sm:hidden flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span className="font-medium">{userProfile.age || "N/A"}y</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Activity className="w-3 h-3 text-cyan-600" />
              <span className="font-medium">{userProfile.weight || "N/A"}kg</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Activity className="w-3 h-3 text-blue-600" />
              <span className="font-medium">{userProfile.height || "N/A"}cm</span>
            </div>
          </div>
          
          {/* Show remaining health conditions count if any */}
          {healthConditions.length > 2 && (
            <div className="text-xs text-gray-500">
              +{healthConditions.length - 2} more
            </div>
          )}
        </div>
      </div>

      {/* Doctor Management Modal */}
      {showDoctors && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold">Doctor Management</h2>
                  <p className="text-blue-100 text-sm sm:text-lg mt-1">
                    Connect and communicate with your healthcare team
                  </p>
                </div>
              </div>
              <button
                onClick={handleShowDoctors}
                className="p-2 sm:p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg sm:rounded-xl transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-4 sm:p-8">
                <DoctorManagement condition="diabetes" />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-600 flex items-center space-x-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Your healthcare team is essential for comprehensive care</span>
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={handleShowDoctors}
                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-gray-500 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-colors font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                  <button
                    onClick={() => console.log("Add new doctor")}
                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Doctor</span>
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