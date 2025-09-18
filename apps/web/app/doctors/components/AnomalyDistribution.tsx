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
} from "recharts";
import { AnomalyData } from "@/types/doctor";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

interface AnomalyProps {
  anomalyDistributionPie?: AnomalyData[]; // expects { risk: string; riskValue: number }
  anomalyDistributionBar?: AnomalyData[]; // expects { vital: string; normal: number; abnormal: number }
}

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
            <Tooltip />
            <Bar dataKey="normal" stackId="a" fill="#10B981" name="Normal" />
            <Bar dataKey="abnormal" stackId="a" fill="#EF4444" name="Abnormal" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnomalyDistributionChart;
