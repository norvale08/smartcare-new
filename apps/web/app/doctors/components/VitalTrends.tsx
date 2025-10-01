import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { VitalTrend } from "@/types/doctor";


// Define the props for the component
interface VitalTrendsChartProps {
  vitalTrends: VitalTrend;
  selectedVital: keyof VitalTrend;
  setSelectedVital: (vital: keyof VitalTrend) => void;
}

const VitalTrendsChart: React.FC<VitalTrendsChartProps> = ({
  vitalTrends,
  selectedVital,
  setSelectedVital,
}) => {

  const vitals = [
    { key: "heartRate", label: "Heart Rate", color: "#8B5CF6" }, // purple
    { key: "bloodPressure", label: "Blood Pressure", color: "#EF4444" }, // red/blue handled below
    { key: "glucose", label: "Glucose", color: "#10B981" }, // green
    { key: "bmi", label: "BMI", color: "#F59E0B" }, // orange
  ] as const;

  const currentVital = vitals.find((v) => v.key === selectedVital);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Vital Trends</h2>
        <select
          value={selectedVital}
          onChange={(e) => setSelectedVital(e.target.value as keyof VitalTrend)}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        >
          {vitals.map((v) => (
            <option key={v.key} value={v.key}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          {selectedVital === 'bloodPressure' ? (
            <LineChart data={vitalTrends.bloodPressure}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time"
                interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="#EF4444" strokeWidth={2} name="Systolic" connectNulls={true} />
              <Line type="monotone" dataKey="diastolic" stroke="#3B82F6" strokeWidth={2} name="Diastolic" connectNulls={true} />
            </LineChart>
          ) : (
            <LineChart data={vitalTrends[selectedVital]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={currentVital?.color || "#10B981"} strokeWidth={2} connectNulls={true} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VitalTrendsChart;
