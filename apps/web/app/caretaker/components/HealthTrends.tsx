// app/caretaker/components/HealthTrends.tsx
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { VitalSigns } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface HealthTrendsProps {
  patientVitals: VitalSigns[];
  showDetailed?: boolean;
}

const HealthTrends: React.FC<HealthTrendsProps> = ({ 
  patientVitals, 
  showDetailed = false 
}) => {
  // Format data for charts
  const chartData = patientVitals.map(vital => ({
    timestamp: new Date(vital.timestamp).toLocaleDateString(),
    time: new Date(vital.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    systolic: vital.systolic,
    diastolic: vital.diastolic,
    heartRate: vital.heartRate,
    glucose: vital.glucose,
    fullTimestamp: vital.timestamp,
  })).reverse(); // Reverse to show chronological order

  const hasHypertensionData = patientVitals.some(v => v.systolic && v.diastolic);
  const hasDiabetesData = patientVitals.some(v => v.glucose);

  if (patientVitals.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Health Trends</h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          No vitals data available for trends
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'systolic' || entry.name === 'diastolic' ? 'mmHg' : 
                              entry.name === 'heartRate' ? 'bpm' : 
                              entry.name === 'glucose' ? 'mg/dL' : ''}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            {payload[0]?.payload.time}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">
          {showDetailed ? 'Detailed Vitals History' : 'Health Trends'}
        </h3>
      </div>

      <div className="space-y-6">
        {/* Blood Pressure Chart */}
        {hasHypertensionData && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Blood Pressure Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#8884d8" 
                    name="Systolic (mmHg)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#82ca9d" 
                    name="Diastolic (mmHg)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Heart Rate Chart */}
        {hasHypertensionData && patientVitals.some(v => v.heartRate) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Heart Rate Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#ff7300" 
                    name="Heart Rate (bpm)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Glucose Chart */}
        {hasDiabetesData && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Glucose Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="glucose" 
                    stroke="#ff0000" 
                    name="Glucose (mg/dL)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {!showDetailed && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            {hasHypertensionData && (
              <>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-blue-600 font-medium">Avg BP</div>
                  <div>
                    {Math.round(chartData.reduce((sum, d) => sum + (d.systolic || 0), 0) / chartData.length)}/
                    {Math.round(chartData.reduce((sum, d) => sum + (d.diastolic || 0), 0) / chartData.length)}
                  </div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-green-600 font-medium">Avg HR</div>
                  <div>
                    {Math.round(chartData.reduce((sum, d) => sum + (d.heartRate || 0), 0) / chartData.length)} bpm
                  </div>
                </div>
              </>
            )}
            {hasDiabetesData && (
              <div className="text-center p-2 bg-orange-50 rounded col-span-2">
                <div className="text-orange-600 font-medium">Avg Glucose</div>
                <div>
                  {Math.round(chartData.reduce((sum, d) => sum + (d.glucose || 0), 0) / chartData.length)} mg/dL
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTrends;