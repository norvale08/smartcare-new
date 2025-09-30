"use client";

import React from "react";
import dynamic from "next/dynamic";

const Provider = dynamic(() => import("../../components/maps/ProviderMap"), {
  ssr: false,
});

const NearbyClinics: React.FC = () => {
  return (
    <div className="w-full max-w-4xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Nearby Clinics
      </h3>
      <Provider />
    </div>
  );
};

export default NearbyClinics;
