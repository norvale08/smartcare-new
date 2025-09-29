import React, { useState, useEffect } from "react";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const UserProfileHeader: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (token && typeof token === "string") {
        console.log("✅ Token found");

        try {
          const tokenParts = token.split(".");
          if (tokenParts.length === 3 && tokenParts[1]) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp < currentTime) {
              console.log("❌ Token expired");
              localStorage.removeItem("token");
              sessionStorage.removeItem("token");
              return null;
            }
          }
        } catch (e) {
          console.log("⚠️ Non-JWT token or parsing error");
        }

        return token;
      }
      return null;
    } catch (error) {
      console.error("❌ Storage access error:", error);
      return null;
    }
  };

  const calculateAge = (dob: string): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const calculateBMI = (weight: number, height: number): string => {
    if (!weight || !height) return "N/A";
    const bmi = weight / Math.pow(height / 100, 2);
    return bmi.toFixed(1);
  };

  const getBMIStatus = (bmi: string): { status: string; color: string } => {
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return { status: "Unknown", color: "text-gray-500" };

    if (bmiValue < 18.5) return { status: "Underweight", color: "text-blue-600" };
    if (bmiValue < 25) return { status: "Normal", color: "text-green-600" };
    if (bmiValue < 30) return { status: "Overweight", color: "text-yellow-600" };
    return { status: "Obese", color: "text-red-600" };
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      console.log("🔍 Fetching profile from:", `${API_URL}/api/profile/me`);

      const response = await fetch(`${API_URL}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📋 Profile data received:", result);

        if (result.success && result.data) {
          const profileData = result.data;
          const age = profileData.dob ? calculateAge(profileData.dob) : undefined;

          setUserProfile({
            ...profileData,
            age,
          });
          console.log("✅ Profile loaded successfully");
        } else {
          setError("Invalid response format from server");
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: "Server error" }));
        console.error("❌ Error response:", errorData);

        if (errorData.code === "PROFILE_NOT_FOUND") {
          setError("Profile not found. Please complete your profile setup.");
        } else {
          setError(errorData.message || `Server error: ${response.status}`);
        }
      }
    } catch (err) {
      console.error("❌ Network error:", err);

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to server. Please check your connection.");
      } else {
        setError("Network error while fetching profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-300 rounded w-48"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3 text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold">Profile Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchUserProfile}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-3 text-2xl">ℹ️</div>
          <div>
            <h3 className="text-yellow-800 font-semibold">Profile Not Found</h3>
            <p className="text-yellow-700 text-sm">
              Please complete your profile to get personalized health
              recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(userProfile.weight, userProfile.height);
  const bmiStatus = getBMIStatus(bmi);

  // Get active health conditions
  const healthConditions = [];
  if (userProfile.diabetes) healthConditions.push("Diabetes");
  if (userProfile.hypertension) healthConditions.push("Hypertension");
  if (userProfile.cardiovascular) healthConditions.push("Cardiovascular");

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md rounded-xl p-6 mb-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        {/* Profile Picture */}
        <div className="relative">
          {userProfile.picture ? (
            <img
              src={userProfile.picture}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-white text-3xl font-bold">
                {userProfile.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
        </div>

        {/* Name and Info */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {userProfile.fullName}
          </h2>
          <p className="text-gray-600 text-sm mb-2">{userProfile.phoneNumber}</p>

          {/* Health Conditions Badge */}
          {healthConditions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {healthConditions.map((condition) => (
                <span
                  key={condition}
                  className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                >
                  {condition}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm border border-blue-200 font-medium text-sm">
          Edit Profile
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Age */}
        <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {userProfile.age || "N/A"}
          </div>
          <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            Age (years)
          </div>
        </div>

        {/* Weight */}
        <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {userProfile.weight || "N/A"}
          </div>
          <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            Weight (kg)
          </div>
        </div>

        {/* Height */}
        <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {userProfile.height || "N/A"}
          </div>
          <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            Height (cm)
          </div>
        </div>

        {/* BMI */}
        <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className={`text-3xl font-bold mb-1 ${bmiStatus.color}`}>
            {bmi}
          </div>
          <div
            className={`text-xs font-medium uppercase tracking-wide ${bmiStatus.color}`}
          >
            BMI ({bmiStatus.status})
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">👤</span>
            <span className="text-gray-600 font-medium mr-2">Gender:</span>
            <span className="text-gray-800 capitalize">
              {userProfile.gender || "Not specified"}
            </span>
          </div>

          {userProfile.dob && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">🎂</span>
              <span className="text-gray-600 font-medium mr-2">
                Date of Birth:
              </span>
              <span className="text-gray-800">
                {userProfile.dob
                  ? new Date(userProfile.dob).toLocaleDateString()
                  : "Not specified"}
              </span>
            </div>
          )}

          <div className="flex items-center">
            <span className="text-gray-500 mr-2">👥</span>
            <span className="text-gray-600 font-medium mr-2">
              Relationship:
            </span>
            <span className="text-gray-800 capitalize">
              {userProfile.relationship || "Not specified"}
            </span>
          </div>

          {userProfile.allergies && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">⚠️</span>
              <span className="text-gray-600 font-medium mr-2">Allergies:</span>
              <span className="text-gray-800">{userProfile.allergies}</span>
            </div>
          )}
        </div>
      </div>

      {/* Health Tip Banner */}
      {userProfile.weight &&
        userProfile.height &&
        !isNaN(parseFloat(bmi)) && (
          <div className="mt-4 p-4 bg-blue-100 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-700">
                💡 Health Tip:{" "}
              </span>
              {parseFloat(bmi) < 18.5 &&
                "Consider consulting with a nutritionist about healthy weight gain strategies."}
              {parseFloat(bmi) >= 18.5 &&
                parseFloat(bmi) < 25 &&
                "Excellent! You're in a healthy weight range. Maintain your current lifestyle!"}
              {parseFloat(bmi) >= 25 &&
                parseFloat(bmi) < 30 &&
                "Focus on portion control and regular physical activity to reach optimal weight."}
              {parseFloat(bmi) >= 30 &&
                "Consider working with a healthcare team for comprehensive weight management support."}
            </p>
          </div>
        )}
    </div>
  );
};

export default UserProfileHeader;
