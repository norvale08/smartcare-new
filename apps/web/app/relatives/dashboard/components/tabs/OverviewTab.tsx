// relative/dashboard/components/tabs/OverviewTab.tsx
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Clock, Thermometer, Heart, Droplets, Activity } from 'lucide-react';
import { HealthSummary, ChartDataPoint, HealthStats, PatientInfo, ChartMetric, ChartPeriod, TabType } from '../../types';
import { DashboardUtils } from '../../utils';

interface OverviewTabProps {
  summary: HealthSummary | null;
  chartData: ChartDataPoint[];
  selectedMetric: ChartMetric;
  chartPeriod: ChartPeriod;
  stats: HealthStats | null;
  patientData: PatientInfo | null;
  onMetricChange: (metric: ChartMetric) => void;
  onPeriodChange: (period: ChartPeriod) => void;
  onTabChange: (tab: TabType) => void;
}

export function OverviewTab({
  summary,
  chartData,
  selectedMetric,
  chartPeriod,
  stats,
  patientData,
  onMetricChange,
  onPeriodChange,
  onTabChange
}: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Health Summary and Charts */}
      <div className="lg:col-span-2 space-y-4">
        {/* Health Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Health Summary</h3>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {summary?.timestamp ? `Last updated: ${DashboardUtils.formatDate(summary.timestamp)}` : 'No recent data'}
              </span>
            </div>
          </div>

          {summary?.hasData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summary.systolic !== undefined && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700">Systolic BP</p>
                    <Thermometer className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{summary.systolic}</p>
                    <p className="ml-2 text-sm text-gray-500">mmHg</p>
                  </div>
                </div>
              )}

              {summary.diastolic !== undefined && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-indigo-700">Diastolic BP</p>
                    <Thermometer className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{summary.diastolic}</p>
                    <p className="ml-2 text-sm text-gray-500">mmHg</p>
                  </div>
                </div>
              )}

              {summary.heartRate !== undefined && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-700">Heart Rate</p>
                    <Heart className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{summary.heartRate}</p>
                    <p className="ml-2 text-sm text-gray-500">BPM</p>
                  </div>
                </div>
              )}

              {summary.glucose !== undefined && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-orange-700">Glucose</p>
                    <Droplets className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{summary.glucose}</p>
                    <p className="ml-2 text-sm text-gray-500">mg/dL</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No health data available yet</p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        {chartData.length > 0 ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Health Trends</h3>
              <div className="flex space-x-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => onMetricChange(e.target.value as ChartMetric)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="bloodPressure">Blood Pressure</option>
                  <option value="heartRate">Heart Rate</option>
                  <option value="glucose">Glucose Level</option>
                </select>
                <button
                  onClick={() => onPeriodChange(7)}
                  className={`px-3 py-1 text-sm rounded-md ${chartPeriod === 7 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => onPeriodChange(14)}
                  className={`px-3 py-1 text-sm rounded-md ${chartPeriod === 14 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  14 Days
                </button>
                <button
                  onClick={() => onPeriodChange(30)}
                  className={`px-3 py-1 text-sm rounded-md ${chartPeriod === 30 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {selectedMetric === 'bloodPressure' && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">Blood Pressure Trend</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                      label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Systolic"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Diastolic"
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 flex justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border-2 border-red-500 rounded mr-2"></div>
                    <span className="text-gray-600">High ({'>'}140/90)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                    <span className="text-gray-600">Normal (120/80)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-500 rounded mr-2"></div>
                    <span className="text-gray-600">Low ({'<'}90/60)</span>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'heartRate' && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">Heart Rate Trend</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                      label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#10b981"
                      fill="#d1fae5"
                      strokeWidth={2}
                      name="Heart Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex justify-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                    <span className="text-gray-600">Normal Range: 60-100 BPM</span>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'glucose' && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">Blood Glucose Trend</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                      label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="glucose"
                      stroke="#f59e0b"
                      fill="#fef3c7"
                      strokeWidth={2}
                      name="Glucose Level"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border-2 border-red-500 rounded mr-2"></div>
                    <span className="text-gray-600">High ({'>'}180)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                    <span className="text-gray-600">Normal (70-180)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-500 rounded mr-2"></div>
                    <span className="text-gray-600">Low ({'<'}70)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Chart Data Available</h3>
              <p className="mt-1 text-sm text-gray-500">
                No health data has been logged yet for the selected period.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Statistics and Quick Actions */}
      <div className="space-y-4">
        {/* Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Statistics</h3>
          {stats ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Readings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
              </div>
              {stats.avgSystolic !== undefined && stats.avgSystolic > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Systolic BP</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.avgSystolic} mmHg</p>
                </div>
              )}
              {stats.avgDiastolic !== undefined && stats.avgDiastolic > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Diastolic BP</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.avgDiastolic} mmHg</p>
                </div>
              )}
              {stats.avgHeartRate !== undefined && stats.avgHeartRate > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Heart Rate</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.avgHeartRate} BPM</p>
                </div>
              )}
              {stats.avgGlucose !== undefined && stats.avgGlucose > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Glucose</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.avgGlucose} mg/dL</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No statistics available</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => onTabChange('vitals')}
              className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
            >
              <h4 className="font-medium text-blue-700">View All Health Data</h4>
              <p className="text-sm text-blue-600 mt-1">See detailed health records</p>
            </button>
            <button
              onClick={() => onTabChange('medications')}
              className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
            >
              <h4 className="font-medium text-green-700">Medication Tracker</h4>
              <p className="text-sm text-green-600 mt-1">View and manage medications</p>
            </button>
            <button
              onClick={() => onTabChange('messages')}
              className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
            >
              <h4 className="font-medium text-green-700">Send Message</h4>
              <p className="text-sm text-green-600 mt-1">Communicate with {patientData?.name?.split(' ')[0] || 'patient'}</p>
            </button>
            <button
              onClick={() => onTabChange('profile')}
              className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
            >
              <h4 className="font-medium text-purple-700">Patient Profile</h4>
              <p className="text-sm text-purple-600 mt-1">View patient information</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}