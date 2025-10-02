// AnomalyDistribution.tsx
"use client";
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  CartesianGrid,
  YAxis,
  XAxis,
  Legend,
  LabelList,
} from "recharts";
import { AnomalyPieData, AnomalyBarData } from "@/types/doctor";

const COLORS = ["#ef4444", "#eab308", "#22c55e"];

interface AnomalyProps {
  anomalyDistributionPie?: AnomalyPieData[]; // expects { risk: string; riskValue: number }
  anomalyDistributionBar?: AnomalyBarData[]; // expects { vital: string; normal: number; abnormal: number }
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 shadow-md rounded-lg border">
        <p className="font-semibold">{label}</p>
        <p className="text-green-600">
          Normal: {data.normalCount}
        </p>
        <p className="text-red-600">
          Abnormal: {data.abnormalCount}
        </p>
      </div>
    );
  }
  return null;
};
const AnomalyDistributionChart: React.FC<AnomalyProps> = ({
  anomalyDistributionPie = [],
  anomalyDistributionBar = [],
}) => {
  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Anomaly Distribution By Risk Level</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={anomalyDistributionPie}
              dataKey="riskValue"
              nameKey="risk"
              outerRadius={100}
              label={({ name }) => name || ""} // <-- safely handle undefined
              labelLine={false} // optional, makes it cleaner
            >
              {anomalyDistributionPie.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Anomaly Distribution by Vital Signs</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={anomalyDistributionBar}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vital" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="normal" stackId="a" fill="#4ade80" name="Normal (%)">
              <LabelList
                dataKey="normal"
                position="inside"
                formatter={(label: React.ReactNode) => {
                  if (typeof label === "number" && label > 0) {
                    return `${label}%`;
                  }
                  return ""; // hide 0% (or anything invalid)
                }}
              />
            </Bar>
            <Bar dataKey="abnormal" stackId="a" fill="#f87171" name="Abnormal (%)">
              <LabelList
                dataKey="abnormal"
                position="inside"
                formatter={(label: React.ReactNode) => {
                  if (typeof label === "number" && label > 0) {
                    return `${label}%`;
                  }
                  return ""; // hide 0% (or anything invalid)
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnomalyDistributionChart;
