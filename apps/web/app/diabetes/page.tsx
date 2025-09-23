"use client";
import React, { useState } from "react";
import DiabetesVitals from "../components/diabetesPages/diabetesVitals";
import DiabetesAlerts from "../components/diabetesPages/DiabetesAlerts";

const Page = () => {
  const [refreshToken, setRefreshToken] = useState(0);

  // Trigger refresh in DiabetesAlerts
  const handleVitalsSubmit = () => {
    setRefreshToken(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <DiabetesAlerts refreshToken={refreshToken} />
      <DiabetesVitals onSubmit={handleVitalsSubmit} />
    </div>
  );
};

export default Page;
