// relative/dashboard/components/tabs/OverviewTab.tsx
import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Clock, Thermometer, Heart, Droplets, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

interface TrendAnalysis {
  vital: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  percentage: number;
  avgValue: number;  
  avgDiastolic?: number;
  unit: string;
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
  const [currentTrendAnalysis, setCurrentTrendAnalysis] = useState<TrendAnalysis | null>(null);

  // Calculate trend for currently selected metric
  useEffect(() => {
    if (chartData.length < 2) {
      setCurrentTrendAnalysis(null);
      return;
    }

    const analysis = calculateMetricTrend(selectedMetric, chartData);
    setCurrentTrendAnalysis(analysis);
  }, [chartData, selectedMetric]);

  // Calculate trend for a specific metric
  const calculateMetricTrend = (metric: ChartMetric, data: ChartDataPoint[]): TrendAnalysis | null => {
    let values: number[] = [];    
    let diastolicValues: number[] = [];
    let vital = '';
    let unit = '';

    switch (metric) {
      case 'bloodPressure':
        values = data.filter(d => d.systolic !== undefined).map(d => d.systolic!);
        diastolicValues = data.filter(d => d.diastolic !== undefined).map(d => d.diastolic!);
        vital = 'Blood Pressure';
        unit = 'mmHg';
        break;
      case 'heartRate':
        values = data.filter(d => d.heartRate !== undefined).map(d => d.heartRate!);
        vital = 'Heart Rate';
        unit = 'bpm';
        break;
      case 'glucose':
        values = data.filter(d => d.glucose !== undefined).map(d => d.glucose!);
        vital = 'Glucose';
        unit = 'mg/dL';
        break;
    }

    if (!values || values.length < 2) return null;

    // Calculate linear regression slope
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
    const lastVal = values[values.length - 1] ?? 0;    
    const change = lastVal - firstVal;
    const percentage = firstVal !== 0 ? (change / firstVal) * 100 : 0;
    // Calculate average using the actual count of readings 
    const validValues = values.filter(v => v !== undefined && v !== null && !isNaN(v));
    const avgValue = validValues.length > 0 
      ? Math.round(validValues.reduce((sum, val) => sum + val, 0) / validValues.length)
      : 0;

    // For blood pressure, also calculate diastolic average
    let avgDiastolic: number | undefined;
    if (metric === 'bloodPressure' && diastolicValues.length > 0) {
      const validDiastolic = diastolicValues.filter(v => v !== undefined && v !== null && !isNaN(v));
      avgDiastolic = validDiastolic.length > 0
        ? Math.round(validDiastolic.reduce((sum, val) => sum + val, 0) / validDiastolic.length)
        : undefined;
    }

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.5) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      vital,
      trend,
      change: Math.round(change * 10) / 10,
      percentage: Math.round(percentage),
      avgValue,
      avgDiastolic,
      unit
    };
  };

  // Calculate comprehensive health analysis for all vitals
  const getComprehensiveAnalysis = () => {
    if (chartData.length < 2) return null;

    const analyses = {
      bloodPressure: calculateMetricTrend('bloodPressure', chartData),
      heartRate: calculateMetricTrend('heartRate', chartData),
      glucose: calculateMetricTrend('glucose', chartData),
    };

    // Get latest values
    const latestData = chartData[chartData.length - 1];
    if (!latestData) return null;
    
    const warnings: string[] = [];
    const normal: string[] = [];

    // Blood Pressure Analysis
    if (analyses.bloodPressure && latestData.systolic && latestData.diastolic) {
      if (latestData.systolic >= 180 || latestData.diastolic >= 120) {
        warnings.push(`⚠️ Blood pressure critically high (${latestData.systolic}/${latestData.diastolic} mmHg) - Seek immediate medical attention`);
      } else if (latestData.systolic >= 140 || latestData.diastolic >= 90) {
        warnings.push(`⚠️ Blood pressure elevated (${latestData.systolic}/${latestData.diastolic} mmHg) - Consult doctor soon`);
      } else if (latestData.systolic < 90 || latestData.diastolic < 60) {
        warnings.push(`⚠️ Blood pressure low (${latestData.systolic}/${latestData.diastolic} mmHg) - Monitor for dizziness`);
      } else {
        normal.push(`✅ Blood pressure within normal range (${latestData.systolic}/${latestData.diastolic} mmHg)`);
      }

      // Trend warnings
      if (analyses.bloodPressure.trend === 'increasing' && latestData.systolic >= 130) {
        warnings.push(`📈 Blood pressure trending upward over ${chartPeriod} days - Monitor closely`);
      }
    }

    // Heart Rate Analysis
    if (analyses.heartRate && latestData.heartRate) {
      if (latestData.heartRate > 100) {
        warnings.push(`⚠️ Heart rate elevated (${latestData.heartRate} bpm) - Above normal range`);
      } else if (latestData.heartRate < 60) {
        warnings.push(`⚠️ Heart rate low (${latestData.heartRate} bpm) - Below normal range`);
      } else {
        normal.push(`✅ Heart rate within normal range (${latestData.heartRate} bpm)`);
      }

      // Trend warnings
      if (Math.abs(analyses.heartRate.change) > 20) {
        warnings.push(`📊 Significant heart rate variation (${analyses.heartRate.change > 0 ? '+' : ''}${analyses.heartRate.change} bpm change)`);
      }
    }

    // Glucose Analysis
    if (analyses.glucose && latestData.glucose) {
      if (latestData.glucose < 70) {
        warnings.push(`⚠️ Glucose critically low (${latestData.glucose} mg/dL) - Risk of hypoglycemia`);
      } else if (latestData.glucose > 200) {
        warnings.push(`⚠️ Glucose very high (${latestData.glucose} mg/dL) - Seek medical attention`);
      } else if (latestData.glucose > 180) {
        warnings.push(`⚠️ Glucose elevated (${latestData.glucose} mg/dL) - Monitor closely`);
      } else if (latestData.glucose > 125 && patientData?.diabetes) {
        warnings.push(`⚠️ Glucose slightly elevated (${latestData.glucose} mg/dL) - Continue monitoring`);
      } else {
        normal.push(`✅ Glucose within acceptable range (${latestData.glucose} mg/dL)`);
      }

      // Trend warnings
      if (analyses.glucose.trend === 'increasing' && latestData.glucose > 140) {
        warnings.push(`📈 Glucose trending upward over ${chartPeriod} days - Review diet and medication`);
      }
    }

    return { warnings, normal, analyses };
  };

  const comprehensiveAnalysis = getComprehensiveAnalysis();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: string, metric: ChartMetric) => {
    if (trend === 'stable') return 'text-blue-600';
    
    // For BP and Glucose, increasing is bad
    if (metric === 'bloodPressure' || metric === 'glucose') {
      return trend === 'increasing' ? 'text-red-600' : 'text-green-600';
    }
    
    // For heart rate, large changes in either direction can be concerning
    if (metric === 'heartRate') {
      return 'text-yellow-600';
    }
    
    return 'text-blue-600';
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
              {entry.name.includes('Systolic') || entry.name.includes('Diastolic') ? ' mmHg' :
               entry.name.includes('Heart') ? ' bpm' :
               entry.name.includes('Glucose') ? ' mg/dL' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
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

            {/* Current Metric Trend Analysis */}
            {currentTrendAnalysis && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{currentTrendAnalysis.vital} Trend</h4>
                  <div className={`flex items-center gap-2 ${getTrendColor(currentTrendAnalysis.trend, selectedMetric)}`}>
                    {getTrendIcon(currentTrendAnalysis.trend)}
                    <span className="font-medium capitalize">{currentTrendAnalysis.trend}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Average</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMetric === 'bloodPressure' && currentTrendAnalysis.avgDiastolic 
                        ? `${currentTrendAnalysis.avgValue}/${currentTrendAnalysis.avgDiastolic}`
                        : currentTrendAnalysis.avgValue
                      } {currentTrendAnalysis.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Change</p>
                    <p className={`font-semibold ${currentTrendAnalysis.change > 0 ? 'text-red-600' : currentTrendAnalysis.change < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                      {currentTrendAnalysis.change > 0 ? '+' : ''}{currentTrendAnalysis.change} {currentTrendAnalysis.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Percentage</p>
                    <p className={`font-semibold ${currentTrendAnalysis.percentage > 0 ? 'text-red-600' : currentTrendAnalysis.percentage < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                      {currentTrendAnalysis.percentage > 0 ? '+' : ''}{currentTrendAnalysis.percentage}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comprehensive Health Analysis */}
            {comprehensiveAnalysis && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Comprehensive Health Analysis</h4>
                
                {/* Warnings Section */}
                {comprehensiveAnalysis.warnings.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Areas Requiring Attention
                    </h5>
                    <ul className="space-y-2">
                      {comprehensiveAnalysis.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="flex-shrink-0 mt-0.5">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Normal Section */}
                {comprehensiveAnalysis.normal.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Healthy Vitals
                    </h5>
                    <ul className="space-y-2">
                      {comprehensiveAnalysis.normal.map((item, index) => (
                        <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                          <span className="flex-shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}                
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
