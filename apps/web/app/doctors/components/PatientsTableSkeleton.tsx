// components/PatientsTableSkeleton.tsx
'use client';
import React from "react";

export default function PatientsTableSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="animate-pulse">
        {/* Table header */}
        <div className="flex mb-4 space-x-4">
          <div className="h-6 w-24 bg-gray-200 rounded"></div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="h-6 w-28 bg-gray-200 rounded"></div>
        </div>

        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between py-3 border-b last:border-none">
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
            <div className="h-5 w-16 bg-gray-200 rounded"></div>
            <div className="h-5 w-20 bg-gray-200 rounded"></div>
            <div className="h-5 w-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
