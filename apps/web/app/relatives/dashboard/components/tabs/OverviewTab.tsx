// relative/dashboard/components/tabs/OverviewTab.tsx
import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Clock, Thermometer, Heart, Droplets, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HealthSummary, ChartDataPoint, HealthStats, PatientInfo, ChartMetric, ChartPeriod, TabType } from '../../types';
import { DashboardUtils, CriticalConditionDetector } from '../../utils';

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

interface TrendAnalysis {
  vital: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'no-data';
  change: number;
  percentage: number;
  normalRange: string;
  currentStatus: string;
  recommendations: string[];
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
  const [trendAnalyses, setTrendAnalyses] = useState<TrendAnalysis[]>([]);

  useEffect(() => {
    const analyses = analyzeVitalTrends(chartData, patientData);
    setTrendAnalyses(analyses);
  }, [chartData, patientData]);

  // --- 1. Logic Helpers ---

  const calculateTrend = (values: number[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
    percentage: number;
  } => {
    if (values.length < 2) return { trend: 'stable', change: 0, percentage: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = values.length;

    for (let i = 0; i < n; i++) {
      const val = values[i] ?? 0;
      sumX += i;
      sumY += val;
      sumXY += i * val;
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const firstVal = values[0] ?? 0;
    const lastVal = values[values.length - 1] ?? 1;

    const change = lastVal - firstVal; // Corrected: last minus first for actual trajectory
    const percentage = firstVal !== 0 ? (change / firstVal) * 100 : 0;

    if (Math.abs(slope) < 0.5) {
      return { trend: 'stable', change, percentage: Math.round(percentage) };
    } else if (slope > 0) {
      return { trend: 'increasing', change, percentage: Math.round(percentage) };
    } else {
      return { trend: 'decreasing', change, percentage: Math.round(percentage) };
    }
  };

  const analyzeVitalTrends = (data: ChartDataPoint[], patientInfo: PatientInfo | null): TrendAnalysis[] => {
    if (!data || data.length < 2) return [];
    const analyses: TrendAnalysis[] = [];

    // --- 1. Blood Pressure Analysis ---
    const bpData = data.filter(d => d.systolic !== undefined && d.diastolic !== undefined);
    if (bpData.length >= 2) {
      const systolicValues = bpData.map(d => d.systolic!);
      const diastolicValues = bpData.map(d => d.diastolic!);
      const sTrend = calculateTrend(systolicValues);

      const latestBP = bpData[bpData.length - 1];

      // FIX: Guard clause for latestBP
      if (latestBP && latestBP.systolic !== undefined && latestBP.diastolic !== undefined) {
        let status = '';
        let recs: string[] = [];

        if (patientInfo?.hypertension) {
          if (latestBP.systolic >= 180 || latestBP.diastolic >= 120) {
            status = '⚠️ Dangerously High';
            recs = ['Seek immediate medical attention'];
          } else if (latestBP.systolic >= 140 || latestBP.diastolic >= 90) {
            status = 'High';
            recs = ['Consult your doctor soon'];
          } else {
            status = '✅ Healthy Range';
          }
        } else {
          if (latestBP.systolic < 90 || latestBP.diastolic < 60) {
            status = 'Low Blood Pressure';
            recs = ['Contact healthcare provider if dizzy'];
          } else if (latestBP.systolic > 140 || latestBP.diastolic > 90) {
            status = 'Elevated';
            recs = ['Monitor regularly'];
          } else {
            status = '✅ Normal';
          }
        }

        analyses.push({
          vital: 'Blood Pressure',
          trend: sTrend.trend,
          change: sTrend.change,
          percentage: sTrend.percentage,
          normalRange: patientInfo?.hypertension ? '130/80 mmHg or lower' : '120/80 mmHg or lower',
          currentStatus: status,
          recommendations: recs
        });
      }
    }

    // --- 2. Heart Rate Analysis ---
    const hrData = data.filter(d => d.heartRate !== undefined);
    if (hrData.length >= 2) {
      const values = hrData.map(d => d.heartRate!);
      const trendInfo = calculateTrend(values);
      const latestHR = values[values.length - 1];

      // FIX: Guard clause for latestHR (checking against undefined specifically because 0 is falsy)
      if (latestHR !== undefined) {
        let status = latestHR > 100 ? '⚠️ Too Fast' : latestHR < 60 ? '⚠️ Too Slow' : '✅ Normal';

        analyses.push({
          vital: 'Heart Rate',
          trend: trendInfo.trend,
          change: trendInfo.change,
          percentage: trendInfo.percentage,
          normalRange: '60-100 BPM',
          currentStatus: status,
          recommendations: status.includes('⚠️') ? ['Consult healthcare provider'] : []
        });
      }
    }

    // --- 3. Glucose Analysis ---
    const glucoseData = data.filter(d => d.glucose !== undefined);
    if (glucoseData.length >= 2) {
      const values = glucoseData.map(d => d.glucose!);
      const trendInfo = calculateTrend(values);
      const latestG = values[values.length - 1];

      // FIX: Guard clause for latestG
      if (latestG !== undefined) {
        let status = '';
        if (latestG < 70) status = '⚠️ Dangerously Low';
        else if (patientInfo?.diabetes && latestG > 180) status = '⚠️ High Glucose Level';
        else if (!patientInfo?.diabetes && latestG > 125) status = 'Slightly High Glucose Level';
        else status = '✅ Normal';

        analyses.push({
          vital: 'Glucose',
          trend: trendInfo.trend,
          change: trendInfo.change,
          percentage: trendInfo.percentage,
          normalRange: patientInfo?.diabetes ? '70-180 mg/dL' : '70-125 mg/dL',
          currentStatus: status,
          recommendations: status.includes('⚠️') ? ['Monitor closely', 'Consult provider'] : []
        });
      }
    }

    return analyses;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-inherit" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-inherit" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (analysis: TrendAnalysis) => {
    // 1. Critical Crisis Priority
    if (analysis.currentStatus.includes('⚠️')) return 'text-red-600';

    const isIncreasing = analysis.trend === 'increasing';
    const isDecreasing = analysis.trend === 'decreasing';

    // 2. Condition-specific logic (BP and Glucose)
    if (analysis.vital === 'Blood Pressure' || analysis.vital === 'Glucose') {
      if (analysis.currentStatus.includes('✅')) return 'text-green-600';
      if (isIncreasing) return 'text-red-600';
      if (isDecreasing) {
        // Red if it's dropping into dangerous "Low" territory
        if (analysis.currentStatus.toLowerCase().includes('low')) return 'text-red-600';
        return 'text-green-600';
      }
    }

    // 3. Heart Rate Logic
    if (analysis.vital === 'Heart Rate') {
      if (Math.abs(analysis.change) > 20) return 'text-yellow-600';
      if (analysis.currentStatus.includes('✅')) return 'text-green-600';
    }

    return 'text-blue-600';
  };
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
      {/* Left Column - Health Summary and Charts */}
      <div className="xl:col-span-2 space-y-4">
        {/* Health Summary */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Current Health Summary</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {summary?.timestamp ? `Last updated: ${DashboardUtils.formatDate(summary.timestamp)}` : 'No recent data'}
              </span>
            </div>
          </div>

          {summary?.hasData ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {summary.systolic !== undefined && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-700">Systolic BP</p>
                    <Thermometer className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary.systolic}</p>
                    <p className="ml-2 text-sm text-gray-500">mmHg</p>
                  </div>
                </div>
              )}
              {summary.diastolic !== undefined && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-indigo-700">Diastolic BP</p>
                    <Thermometer className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary.diastolic}</p>
                    <p className="ml-2 text-sm text-gray-500">mmHg</p>
                  </div>
                </div>
              )}
              {summary.heartRate !== undefined && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-green-700">Heart Rate</p>
                    <Heart className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary.heartRate}</p>
                    <p className="ml-2 text-sm text-gray-500">BPM</p>
                  </div>
                </div>
              )}
              {summary.glucose !== undefined && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-orange-700">Glucose</p>
                    <Droplets className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary.glucose}</p>
                    <p className="ml-2 text-sm text-gray-500">mg/dL</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No health data available yet</p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        {chartData.length > 0 ? (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            {/* Chart Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Health Trends</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <select
                  value={selectedMetric}
                  onChange={(e) => onMetricChange(e.target.value as ChartMetric)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm whitespace-nowrap flex-shrink-0"
                >
                  <option value="bloodPressure">Blood Pressure</option>
                  <option value="heartRate">Heart Rate</option>
                  <option value="glucose">Glucose Level</option>
                </select>
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => onPeriodChange(days as ChartPeriod)}
                    className={`px-3 py-2 text-sm rounded-md whitespace-nowrap flex-shrink-0 ${chartPeriod === days
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Charts */}
            {selectedMetric === 'bloodPressure' && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">Blood Pressure Trend</h4>
                <div className="h-[260px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="systolic" stroke="#3b82f6" strokeWidth={2} name="Systolic" dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="diastolic" stroke="#8b5cf6" strokeWidth={2} name="Diastolic" dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {selectedMetric === 'heartRate' && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">Heart Rate Trend</h4>
                <div className="h-[260px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" label={{ value: 'BPM', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="heartRate" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="Heart Rate" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {selectedMetric === 'glucose' && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">Blood Glucose Trend</h4>
                <div className="h-[260px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="glucose" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} name="Glucose Level" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TREND ANALYSIS SECTION - ADDED BELOW CHARTS */}
            {trendAnalyses.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Vital Trend Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendAnalyses.map((analysis, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{analysis.vital}</h5>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(analysis.trend)}
                          <span className={`text-sm font-medium ${getTrendColor(analysis)}`}>
                            {analysis.trend.charAt(0).toUpperCase() + analysis.trend.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Change: </span>
                          <span className={`font-medium ${analysis.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {analysis.change > 0 ? '+' : ''}{analysis.change.toFixed(1)} ({analysis.percentage}%)
                          </span>
                        </div>

                        <div className="text-sm">
                          <span className="text-gray-600">Normal Range: </span>
                          <span className="font-medium text-blue-600">{analysis.normalRange}</span>
                        </div>

                        <div className="text-sm">
                          <span className="text-gray-600">Current Status: </span>
                          <span className={`font-medium ${analysis.currentStatus.includes('⚠️') ? 'text-red-600' : analysis.currentStatus.includes('✅') ? 'text-green-600' : 'text-yellow-600'}`}>
                            {analysis.currentStatus}
                          </span>
                        </div>

                        {analysis.recommendations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Recommendations:</p>
                            <ul className="text-xs space-y-1">
                              {analysis.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-gray-700">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall Health Assessment */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Overall Health Assessment</h5>
                  <div className="text-sm text-blue-800">
                    {(() => {
                      const criticalAnalyses = trendAnalyses.filter(a => a.currentStatus.includes('⚠️'));
                      const normalAnalyses = trendAnalyses.filter(a => a.currentStatus.includes('✅'));

                      if (criticalAnalyses.length > 0) {
                        return (
                          <p>
                            ⚠️ {criticalAnalyses.length} vital(s) show concerning trends.
                            {patientData?.hypertension && ' Blood pressure management is crucial.'}
                            {patientData?.diabetes && ' Glucose control needs attention.'}
                            Consider consulting healthcare provider.
                          </p>
                        );
                      } else if (normalAnalyses.length === trendAnalyses.length) {
                        return <p>✅ All vital trends are within normal ranges. Continue monitoring regularly.</p>;
                      } else {
                        return <p>Most vital trends are stable. Continue current health management plan.</p>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="text-center py-6 sm:py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No Chart Data Available</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                No health data has been logged yet for the selected period.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Statistics and Quick Actions */}
      <div className="space-y-4">
        {/* Statistics */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Statistics</h3>
          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Readings</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.count}</p>
              </div>
              {stats.avgSystolic !== undefined && stats.avgSystolic > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Systolic BP</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.avgSystolic} mmHg</p>
                </div>
              )}
              {stats.avgDiastolic !== undefined && stats.avgDiastolic > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Diastolic BP</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.avgDiastolic} mmHg</p>
                </div>
              )}
              {stats.avgHeartRate !== undefined && stats.avgHeartRate > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Heart Rate</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.avgHeartRate} BPM</p>
                </div>
              )}
              {stats.avgGlucose !== undefined && stats.avgGlucose > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Avg. Glucose</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.avgGlucose} mg/dL</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No statistics available</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={() => onTabChange('vitals')}
              className="w-full p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
            >
              <h4 className="font-medium text-blue-700">View All Health Data</h4>
              <p className="text-sm text-blue-600 mt-1">See detailed health records</p>
            </button>
            <button
              onClick={() => onTabChange('medications')}
              className="w-full p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
            >
              <h4 className="font-medium text-green-700">Medication Tracker</h4>
              <p className="text-sm text-green-600 mt-1">View and manage medications</p>
            </button>
            <button
              onClick={() => onTabChange('messages')}
              className="w-full p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
            >
              <h4 className="font-medium text-green-700">Send Message</h4>
              <p className="text-sm text-green-600 mt-1">Communicate with {patientData?.name?.split(' ')[0] || 'patient'}</p>
            </button>
            <button
              onClick={() => onTabChange('profile')}
              className="w-full p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
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
