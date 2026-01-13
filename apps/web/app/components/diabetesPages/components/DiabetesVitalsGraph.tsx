import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Heart, AlertCircle, CheckCircle, Info, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const languageContent = {
  en: {
    title: "Your Health Trends",
    glucose: "Glucose",
    bloodPressure: "Blood Pressure",
    systolic: "Systolic",
    diastolic: "Diastolic",
    last30Days: "30 Days",
    last90Days: "90 Days",
    allTime: "All Time",
    mgdl: "mg/dL",
    mmhg: "mmHg",
    noData: "No data available",
    loading: "Loading your health data...",
    averages: "Average",
    latestReading: "Latest Reading",
    trend: "Trend",
    improving: "Going Down (Good)",
    stable: "Stable",
    declining: "Going Up (Check Doctor)",
    normalRange: "Safe Range",
    glucoseNormal: "70-180 mg/dL is safe",
    bpNormal: "Top: 90-140, Bottom: 60-90",
    colorGuide: "What Colors Mean",
    greenZone: "GREEN = GOOD: Your numbers are healthy and safe",
    yellowZone: "YELLOW = BE CAREFUL: Numbers are getting high, watch closely",
    redZone: "RED = DANGER: Too low or too high - See doctor immediately",
    viewingPeriod: "Showing",
    critical: "Critical - See Doctor Now",
    veryHigh: "Very High - Action Needed",
    high: "High - Be Careful",
    normal: "Normal - Good",
    low: "Low - Eat Something Sweet NOW"
  },
  sw: {
    title: "Mwenendo wa Afya Yako",
    glucose: "Sukari ya Damu",
    bloodPressure: "Shinikizo la Damu",
    systolic: "Ya Juu",
    diastolic: "Ya Chini",
    last30Days: "Siku 30",
    last90Days: "Siku 90",
    allTime: "Nyakati Zote",
    mgdl: "mg/dL",
    mmhg: "mmHg",
    noData: "Hakuna data",
    loading: "Inapakia data yako ya afya...",
    averages: "Wastani",
    latestReading: "Kipimo cha Hivi Karibuni",
    trend: "Mwelekeo",
    improving: "Inashuka (Nzuri)",
    stable: "Imara",
    declining: "Inaongezeka (Angalia Daktari)",
    normalRange: "Kiwango Salama",
    glucoseNormal: "70-180 mg/dL ni salama",
    bpNormal: "Juu: 90-140, Chini: 60-90",
    colorGuide: "Maana ya Rangi",
    greenZone: "KIJANI = NZURI: Namba zako ni za afya na salama",
    yellowZone: "MANJANO = JIHADHARI: Namba zinaongezeka, angalia kwa karibu",
    redZone: "NYEKUNDU = HATARI: Chini sana au juu sana - Ona daktari haraka",
    viewingPeriod: "Inaonyesha",
    critical: "Hatari Sana - Ona Daktari Sasa",
    veryHigh: "Juu Sana - Hatua Inahitajika",
    high: "Juu - Jihadhari",
    normal: "Kawaida - Nzuri",
    low: "Chini - Kula Kitu Kitamu SASA"
  }
};

interface VitalsGraphProps {
  language?: "en" | "sw";
}

interface VitalsData {
  date: string;
  glucose: number;
  systolic: number;
  diastolic: number;
  timestamp: number;
}

interface StatData {
  avgGlucose: number;
  avgSystolic: number;
  avgDiastolic: number;
  latest: {
    glucose: number;
    systolic: number;
    diastolic: number;
    date: string;
    timestamp: number;
  };
  trend: string;
  trendIcon: React.ComponentType<any>;
  glucoseStatus: { color: string; status: string };
  bpStatus: { color: string; status: string };
}

const DiabetesVitalsGraph: React.FC<VitalsGraphProps> = ({ language = "en" }) => {
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30' | '90' | 'all'>('30');
  const [activeChart, setActiveChart] = useState<'glucose' | 'bp'>('glucose');
  
  const content = languageContent[language];

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const response = await fetch(`${API_URL}/api/diabetesVitals/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success && result.data) {
        setVitalsData(result.data);
      }
    } catch (error) {
      console.error("Error fetching vitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = (): VitalsData[] => {
    const now = new Date();
    let filtered = vitalsData;

    if (timeRange === '30') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = vitalsData.filter(v => new Date(v.createdAt) >= thirtyDaysAgo);
    } else if (timeRange === '90') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = vitalsData.filter(v => new Date(v.createdAt) >= ninetyDaysAgo);
    }

    return filtered.map(v => ({
      date: new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      glucose: v.glucose,
      systolic: v.systolic,
      diastolic: v.diastolic,
      timestamp: new Date(v.createdAt).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  };

  const getGlucoseStatus = (glucose: number) => {
    if (glucose < 70) return { color: '#dc2626', status: content.low };
    if (glucose >= 70 && glucose <= 180) return { color: '#16a34a', status: content.normal };
    if (glucose > 180 && glucose <= 250) return { color: '#f59e0b', status: content.high };
    if (glucose > 250 && glucose <= 350) return { color: '#dc2626', status: content.veryHigh };
    return { color: '#991b1b', status: content.critical };
  };

  const getBPStatus = (systolic?: number, diastolic?: number) => {
    if (!systolic || !diastolic) return { color: '#64748b', status: 'N/A' };
    
    if (systolic >= 90 && systolic <= 140 && diastolic >= 60 && diastolic <= 90) {
      return { color: '#16a34a', status: content.normal };
    }
    if (systolic <= 160 && diastolic <= 100) {
      return { color: '#f59e0b', status: content.high };
    }
    return { color: '#dc2626', status: content.veryHigh };
  };

  const getStats = (): StatData => {
    const data = getFilteredData();
    
    const defaultStats: StatData = {
      avgGlucose: 0,
      avgSystolic: 0,
      avgDiastolic: 0,
      latest: { glucose: 0, systolic: 0, diastolic: 0, date: '', timestamp: 0 },
      trend: content.stable,
      trendIcon: Minus,
      glucoseStatus: getGlucoseStatus(0),
      bpStatus: getBPStatus(0, 0)
    };

    if (data.length === 0) return defaultStats;

    const avgGlucose = data.reduce((sum, d) => sum + d.glucose, 0) / data.length;
    const validBP = data.filter(d => d.systolic && d.diastolic);
    const avgSystolic = validBP.length > 0 
      ? validBP.reduce((sum, d) => sum + d.systolic, 0) / validBP.length 
      : 0;
    const avgDiastolic = validBP.length > 0
      ? validBP.reduce((sum, d) => sum + d.diastolic, 0) / validBP.length
      : 0;

    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    let trend = content.stable;
    let trendIcon: React.ComponentType<any> = Minus;
    
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.glucose, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.glucose, 0) / secondHalf.length;
      
      if (secondAvg < firstAvg - 15) {
        trend = content.improving;
        trendIcon = ArrowDown;
      } else if (secondAvg > firstAvg + 15) {
        trend = content.declining;
        trendIcon = ArrowUp;
      }
    }

    return {
      avgGlucose: Math.round(avgGlucose),
      avgSystolic: Math.round(avgSystolic),
      avgDiastolic: Math.round(avgDiastolic),
      latest: data[data.length - 1] || defaultStats.latest,
      trend,
      trendIcon,
      glucoseStatus: getGlucoseStatus(avgGlucose),
      bpStatus: getBPStatus(avgSystolic, avgDiastolic)
    };
  };

  const chartData = getFilteredData();
  const stats = getStats();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
        <p className="text-gray-500 mt-4">{content.loading}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{content.noData}</h3>
        <p className="text-gray-500 text-sm">Start tracking your vitals to see your health trends</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden px-2 md:px-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-4 md:p-6 text-white">
        <h2 className="text-xl md:text-2xl font-bold mb-2">{content.title}</h2>
        <p className="text-blue-100 text-sm md:text-base">Track your glucose and blood pressure over time</p>
        <div className="mt-3 flex items-center gap-2 text-xs md:text-sm">
          <Info className="w-4 h-4" />
          <span className="font-medium">{content.viewingPeriod}: {timeRange === '30' ? content.last30Days : timeRange === '90' ? content.last90Days : content.allTime}</span>
        </div>
      </div>

      {/* Color Guide Panel */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md p-4 md:p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800 text-base md:text-lg">{content.colorGuide}</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3 bg-white p-3 rounded-lg border-l-4 border-green-600">
            <div className="w-4 h-4 rounded-full bg-green-600 mt-1 flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-green-700">GREEN = GOOD</p>
              <p className="text-xs text-gray-700 break-words">{content.greenZone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white p-3 rounded-lg border-l-4 border-amber-500">
            <div className="w-4 h-4 rounded-full bg-amber-500 mt-1 flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-700">YELLOW = CAUTION</p>
              <p className="text-xs text-gray-700 break-words">{content.yellowZone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white p-3 rounded-lg border-l-4 border-red-600">
            <div className="w-4 h-4 rounded-full bg-red-600 mt-1 flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-red-700">RED = DANGER</p>
              <p className="text-xs text-gray-700 break-words">{content.redZone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4" style={{ borderColor: stats.glucoseStatus.color }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{content.glucose}</span>
            <Activity className="w-5 h-5" style={{ color: stats.glucoseStatus.color }} />
          </div>
          <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: stats.glucoseStatus.color }}>
            {stats.avgGlucose}
          </div>
          <div className="text-xs text-gray-600 mb-2">{content.mgdl} • {content.averages}</div>
          <div className="mt-2">
            <div className="px-3 py-1.5 rounded-lg text-xs font-bold text-center" 
                 style={{ backgroundColor: `${stats.glucoseStatus.color}`, color: 'white' }}>
              {stats.glucoseStatus.status}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4" style={{ borderColor: stats.bpStatus.color }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{content.bloodPressure}</span>
            <Heart className="w-5 h-5" style={{ color: stats.bpStatus.color }} />
          </div>
          <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: stats.bpStatus.color }}>
            {stats.avgSystolic}/{stats.avgDiastolic}
          </div>
          <div className="text-xs text-gray-600 mb-2">{content.mmhg} • {content.averages}</div>
          <div className="mt-2">
            <div className="px-3 py-1.5 rounded-lg text-xs font-bold text-center"
                 style={{ backgroundColor: `${stats.bpStatus.color}`, color: 'white' }}>
              {stats.bpStatus.status}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{content.trend}</span>
            <stats.trendIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
            {stats.trend}
          </div>
          <div className="text-xs text-gray-600 mb-2">{timeRange === '30' ? content.last30Days : timeRange === '90' ? content.last90Days : content.allTime}</div>
          <div className="mt-2 text-xs text-gray-700 font-medium">
            {content.latestReading}: {stats.latest.glucose} {content.mgdl}
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveChart('glucose')}
              className={`px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap transition-all flex-1 ${
                activeChart === 'glucose'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
            >
              {content.glucose}
            </button>
            <button
              onClick={() => setActiveChart('bp')}
              className={`px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap transition-all flex-1 ${
                activeChart === 'bp'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
            >
              {content.bloodPressure}
            </button>
          </div>

          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex-1 ${
                timeRange === '30' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {content.last30Days}
            </button>
            <button
              onClick={() => setTimeRange('90')}
              className={`px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex-1 ${
                timeRange === '90' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {content.last90Days}
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex-1 ${
                timeRange === 'all' ? 'bg-white text-gray-800 shadow-md' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {content.allTime}
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 md:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'glucose' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#374151"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  height={50}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#374151"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  label={{ value: content.mgdl, angle: -90, position: 'insideLeft', style: { fontWeight: 600, fontSize: 11 } }}
                  domain={[0, 400]}
                  ticks={[0, 50, 100, 150, 200, 250, 300, 350, 400]}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4, fontSize: '13px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                  formatter={(value: any) => [`${value} mg/dL`, 'Glucose']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontWeight: 500, fontSize: '12px' }} />
                
                <ReferenceLine y={70} stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" label={{ value: "DANGER Low (70)", fill: "#dc2626", fontWeight: 600, fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={180} stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" label={{ value: "High (180)", fill: "#16a34a", fontWeight: 600, fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={250} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" label={{ value: "Very High (250)", fill: "#f59e0b", fontWeight: 600, fontSize: 10, position: 'insideTopLeft' }} />
                
                <Line 
                  type="monotone" 
                  dataKey="glucose" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name={content.glucose}
                  fill="url(#glucoseGradient)"
                  dot={{ 
                    fill: '#3b82f6', 
                    r: 5,
                    strokeWidth: 2,
                    stroke: 'white'
                  }}
                  activeDot={{ 
                    r: 8, 
                    strokeWidth: 3,
                    fill: '#3b82f6',
                    stroke: 'white'
                  }}
                  isAnimationActive={true}
                />
              </LineChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#374151"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  height={50}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#374151"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  label={{ value: content.mmhg, angle: -90, position: 'insideLeft', style: { fontWeight: 600, fontSize: 11 } }}
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #8b5cf6',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4, fontSize: '13px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                  formatter={(value: any, name: any) => [`${value} mmHg`, name === 'systolic' ? 'Top' : 'Bottom']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontWeight: 500, fontSize: '12px' }} />
                
                <ReferenceLine y={90} stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" label={{ value: "Top Low (90)", fill: "#16a34a", fontWeight: 600, fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={140} stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" label={{ value: "Top High (140)", fill: "#16a34a", fontWeight: 600, fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={60} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" label={{ value: "Bottom Low (60)", fill: "#8b5cf6", fontWeight: 600, fontSize: 10, position: 'insideBottomLeft' }} />
                <ReferenceLine y={90} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" label={{ value: "Bottom High (90)", fill: "#8b5cf6", fontWeight: 600, fontSize: 10, position: 'insideBottomLeft' }} />
                
                <Line 
                  type="monotone" 
                  dataKey="systolic" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  name={content.systolic}
                  dot={{ 
                    fill: '#dc2626', 
                    r: 5,
                    strokeWidth: 2,
                    stroke: 'white'
                  }}
                  activeDot={{ 
                    r: 8, 
                    strokeWidth: 3,
                    fill: '#dc2626',
                    stroke: 'white'
                  }}
                  isAnimationActive={true}
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolic" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name={content.diastolic}
                  dot={{ 
                    fill: '#8b5cf6', 
                    r: 5,
                    strokeWidth: 2,
                    stroke: 'white'
                  }}
                  activeDot={{ 
                    r: 8, 
                    strokeWidth: 3,
                    fill: '#8b5cf6',
                    stroke: 'white'
                  }}
                  isAnimationActive={true}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-800 text-sm">{content.normalRange}:</span>
            </div>
            {activeChart === 'glucose' ? (
              <p className="ml-6 text-xs text-gray-700 font-semibold">{content.glucoseNormal}</p>
            ) : (
              <p className="ml-6 text-xs text-gray-700 font-semibold">{content.bpNormal}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DiabetesVitalsGraph;