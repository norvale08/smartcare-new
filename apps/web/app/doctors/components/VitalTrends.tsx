import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip, 
  CartesianGrid,
  ResponsiveContainer,
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
    { key: "heartRate", label: "Heart Rate" },
    { key: "bloodPressure", label: "Blood Pressure" },
    { key: "temperature", label: "Temperature" },
    {key: "glucose", label: "Glucose"},
  ] as const;

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
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="systolic" stroke="#EF4444" strokeWidth={2} name="Systolic" />
              <Line type="monotone" dataKey="diastolic" stroke="#3B82F6" strokeWidth={2} name="Diastolic" />
            </LineChart>
          ) : (
            <LineChart data={vitalTrends[selectedVital]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VitalTrendsChart;
