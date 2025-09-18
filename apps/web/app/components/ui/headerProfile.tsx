"use client";
import React, { useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";

type User = {
  id: string;
  email: string;
  name?: string; 
  firstName?: string;
  lastName?: string;
};

const HeaderProfile = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
  }, []);

  // Safe initials
  const getInitials = () => {
    if (!user) return "?";

    if (user.firstName && user.lastName) {
      return (
        user.firstName.charAt(0).toUpperCase() +
        user.lastName.charAt(0).toUpperCase()
      );
    }

    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n.charAt(0).toUpperCase())
        .join("");
    }

    return "?";
  };

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
      <div className="flex flex-row items-center gap-2">
        <HeartPulse color="#21a136" size={24} />
        <h1 className="text-xl font-semibold text-gray-800">
          SmartCare Dashboard
        </h1>
      </div>

      <div className="flex flex-row items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{getInitials()}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user
              ? user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.name || user.email
              : "Loading..."}
          </span>
        </div>
      </div>
    </header>
  );
};

export default HeaderProfile;
