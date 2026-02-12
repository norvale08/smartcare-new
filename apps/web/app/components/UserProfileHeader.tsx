"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import DoctorManagement from "./DoctorManagement";
import PatientMessages from '@/app/relatives/dashboard/components/PatientMessages';
import {
  User,
  Stethoscope,
  X,
  Calendar,
  Activity,
  AlertCircle,
  RefreshCw,
  Plus,
  Clock,
  Languages,
  LogOut,
  ChevronDown,
  MessageSquare
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
  currentLanguage?: "en" | "sw";
  onLanguageChange?: (language: "en" | "sw") => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  onDoctorsToggle,
  currentLanguage = "en",
  onLanguageChange
}) => {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "sw">(currentLanguage);
  const [showMessages, setShowMessages] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("preferredLanguage");
      }

      // Sign out from NextAuth
      await signOut({
        redirect: false,
        callbackUrl: "/login"
      });

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if there's an error
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showDoctors) {
        handleShowDoctors();
      }
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    }
  }, [showDoctors, showProfileMenu]);

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleShowDoctors();
    }
  }, []);

  // Handle language change
  const handleLanguageChange = (newLanguage: "en" | "sw") => {
    setLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", newLanguage);
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  // Load language preference from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("preferredLanguage") as "en" | "sw";
      if (savedLanguage && savedLanguage !== language) {
        setLanguage(savedLanguage);
        if (onLanguageChange) {
          onLanguageChange(savedLanguage);
        }
      }
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
    setShowProfileMenu(false);
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

  // Language content for the header
  const languageContent = {
    en: {
      profile: "Profile",
      doctors: "Doctors",
      logout: "Logout",
      loggingOut: "Logging out...",
      viewProfile: "View Profile",
      dr: "Dr",
      view: "View",
      noProfile: "No Profile Found",
      completeProfile: "Complete your profile to get started",
      profileError: "Profile Error",
      createProfile: "Create Profile",
      doctorManagement: "Doctor Management",
      doctorDescription: "Connect and communicate with your healthcare team",
      close: "Close",
      addDoctor: "Add Doctor",
      healthcareTeam: "Your healthcare team is essential for comprehensive care",
      relative: "Relative",
      familyChat: "Family Messaging",
      familyDescription: "Stay in touch with your relatives and caregivers",
    },
    sw: {
      profile: "Wasifu",
      doctors: "Madaktari",
      logout: "Toka",
      loggingOut: "Inatoka...",
      viewProfile: "Tazama Wasifu",
      dr: "Dk",
      view: "Tazama",
      noProfile: "Hakuna Wasifu Ulipatikana",
      completeProfile: "Kamilisha wasifu wako kuanza",
      profileError: "Hitilafu ya Wasifu",
      createProfile: "Unda Wasifu",
      doctorManagement: "Usimamizi wa Daktari",
      doctorDescription: "Wasiliana na ushirikiano na timu yako ya afya",
      close: "Funga",
      addDoctor: "Ongeza Daktari",
      healthcareTeam: "Timu yako ya afya ni muhimu kwa huduma kamili",
      relative: "Jamaa",
      familyChat: "Ujumbe wa Familia",
      familyDescription: "Wasiliana na jamaa na walezi wako"
    }
  };

  const currentLangContent = languageContent[language];

  // Loading state - COMPACT
  if (loading) {
    return (
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full animate-pulse" />
              <div className="space-y-1.5 hidden sm:block">
                <div className="h-3 bg-gray-300 rounded w-24 animate-pulse" />
                <div className="h-2.5 bg-gray-300 rounded w-20 animate-pulse" />
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-7 bg-gray-300 rounded-lg w-16 animate-pulse" />
              <div className="h-7 bg-gray-300 rounded-lg w-16 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - COMPACT
  if (error && !userProfile) {
    return (
      <div className="w-full bg-white border-b border-red-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-sm font-semibold text-gray-900">{currentLangContent.profileError}</h3>
                <p className="text-xs text-gray-600">{error}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No profile state - COMPACT
  if (!userProfile) {
    return (
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-sm font-semibold text-gray-900">{currentLangContent.noProfile}</h3>
                <p className="text-xs text-gray-600">{currentLangContent.completeProfile}</p>
              </div>
            </div>
            <button
              onClick={handleViewProfile}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-1.5 text-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentLangContent.createProfile}</span>
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
    <div className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          {/* User Info Section - COMPACT */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {/* Profile Picture - Clickable for dropdown */}
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-full"
              >
                {userProfile.picture ? (
                  <img
                    src={userProfile.picture}
                    alt={`${userProfile.fullName}'s profile`}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-cyan-200 shadow-sm hover:border-cyan-300 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-sm hover:from-emerald-600 hover:to-cyan-600 transition-all">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleViewProfile}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{currentLangContent.viewProfile}</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{loggingOut ? currentLangContent.loggingOut : currentLangContent.logout}</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Details - COMPACT */}
            <div className="min-w-0 flex-1">
              {/* Mobile Layout */}
              <div className="sm:hidden">
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                    {userProfile.fullName}
                  </h1>
                  {healthConditions.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded-full">
                      {healthConditions[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop Layout - COMPACT */}
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-semibold text-gray-900">
                    {userProfile.fullName}
                  </h1>
                  {healthConditions.length > 0 && (
                    <div className="flex space-x-1.5">
                      {healthConditions.slice(0, 2).map((condition) => (
                        <span
                          key={condition}
                          className="px-2 py-0.5 bg-cyan-50 text-blue-700 text-xs font-medium rounded-full"
                        >
                          {condition}
                        </span>
                      ))}
                      {healthConditions.length > 2 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          +{healthConditions.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Detailed stats - Compact */}
                <div className="flex items-center space-x-3 text-xs text-gray-600 mt-0.5">
                  <span>{userProfile.age || "N/A"} years</span>
                  <span>•</span>
                  <span>{userProfile.weight || "N/A"} kg</span>
                  <span>•</span>
                  <span>{userProfile.height || "N/A"} cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - COMPACT */}
          <div className="flex items-center space-x-2 ml-3">
            {/* Language Selector - Compact */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as "en" | "sw")}
              className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-200 cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="sw">SW</option>
            </select>

            {/* Manage Doctors Button - Compact */}
            <button
              onClick={handleShowDoctors}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center space-x-1.5 border text-xs ${showDoctors
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white'
                }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentLangContent.doctors}</span>
            </button>

            {/* View Profile Button - Compact */}
            <button
              onClick={handleViewProfile}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors font-medium flex items-center space-x-1.5 text-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentLangContent.profile}</span>
            </button>

            {/* Relative Messaging Button */}
            <button
              onClick={() => setShowMessages(true)}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center space-x-1.5 border text-xs ${showMessages
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                : 'bg-white text-cyan-600 border-cyan-600 hover:bg-cyan-600 hover:text-white'
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentLangContent.relative}</span>
            </button>

            {/* Logout Button - Always Visible */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center space-x-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{loggingOut ? currentLangContent.loggingOut : currentLangContent.logout}</span>
            </button>
          </div>
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
                  <h2 className="text-xl sm:text-3xl font-bold">{currentLangContent.doctorManagement}</h2>
                  <p className="text-cyan-100 text-sm sm:text-lg mt-1">
                    {currentLangContent.doctorDescription}
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
                  <span>{currentLangContent.healthcareTeam}</span>
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={handleShowDoctors}
                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-gray-500 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-colors font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    <span>{currentLangContent.close}</span>
                  </button>
                  <button
                    onClick={() => console.log("Add new doctor")}
                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-emerald-500 text-white rounded-lg sm:rounded-xl hover:bg-emerald-600 transition-colors font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{currentLangContent.addDoctor}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Family Messaging Modal */}
      {showMessages && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
          onClick={() => setShowMessages(false)}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-cyan-600 text-white">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">{currentLangContent.familyChat}</h2>
                  <p className="text-cyan-100 text-xs hidden sm:block">
                    {currentLangContent.familyDescription}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMessages(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messaging Component */}
            <div className="flex-1 overflow-hidden bg-gray-50 p-2 sm:p-4">
              <PatientMessages />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileHeader;