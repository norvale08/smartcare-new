"use client"
import React, { useEffect, useState } from "react";
import { Wine, Cigarette, Coffee, Activity, Heart, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";

interface LifestyleProps {
  lifestyle: {
    alcohol: boolean;
    smoking: boolean;
    caffeine: number;
    exercise: string;
  };
  setLifestyle: (lifestyle: any) => void;
}

interface VitalData {
  systolic: number;
  diastolic: number;
  heartRate: number;
  status: "alert" | "stable";
  timestamp?: Date;
}

interface Recommendation {
  icon: JSX.Element;
  title: string;
  tips?: string[];
  advice?: string[];
}

export default function Lifestyle({ lifestyle, setLifestyle }: LifestyleProps) {
  const [vitalData, setVitalData] = useState<VitalData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Memoized fetch function with proper dependencies
  const fetchLatestVitals = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:3001/api/hypertensionVitals/me', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (!res.ok) return;

      const json = await res.json();
      const vitals = Array.isArray(json?.data) ? json.data : [];
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const todayVitals = vitals
        .filter((v: any) => {
          const t = new Date(v.timestamp || v.createdAt);
          return t >= startOfDay;
        })
        .sort((a: any, b: any) => 
          new Date(b.timestamp || b.createdAt).getTime() - 
          new Date(a.timestamp || a.createdAt).getTime()
        );

      if (todayVitals.length === 0) return;

      const latest = todayVitals[0];
      const systolic = Number(latest.systolic);
      const diastolic = Number(latest.diastolic);
      const heartRate = Number(latest.heartRate);
      
      setVitalData({
        systolic,
        diastolic,
        heartRate,
        status: (systolic > 140 || diastolic > 90 || heartRate < 60 || heartRate > 100) 
          ? "alert" 
          : "stable",
        timestamp: new Date(latest.timestamp || latest.createdAt)
      });
    } catch (error) {
      console.error('Failed to fetch vitals:', error);
    }
  }, []);

  // Fetch current vitals periodically and on changes
  useEffect(() => {
    const interval = setInterval(fetchLatestVitals, 10000); // Refresh every 10 seconds
    fetchLatestVitals(); // Initial fetch
    
    return () => clearInterval(interval);
  }, [fetchLatestVitals, refreshTrigger]); // Add fetchLatestVitals to dependencies

  // Sync vitals when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestVitals();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);



  const getBPRecommendations = (): Recommendation[] => {
    if (!vitalData) return [];
    
    const { systolic, diastolic } = vitalData;
    const recommendations: Recommendation[] = [];
    
    // Blood pressure specific guidance
    if (systolic < 90 || diastolic < 60) {
  recommendations.push({
    icon: <Activity className="text-blue-500" />,
    title: "Low Blood Pressure Care",
    tips: [
      "Stay hydrated — drink 2–3L water daily",
      "Eat small, frequent meals",
      "Avoid standing up too quickly",
      "Limit alcohol intake",
      "Wear compression stockings if needed"
    ]
  });
} else if (systolic < 120 && diastolic < 80) {
  recommendations.push({
    icon: <CheckCircle className="text-green-500" />,
    title: "Maintain Healthy BP",
    tips: [
      "Continue a balanced diet",
      "Exercise 150min/week",
      "Maintain healthy weight",
      "Get 7–8 hours sleep",
      "Avoid smoking"
    ]
  });
} else if (systolic < 130 && diastolic < 80) {
  recommendations.push({
    icon: <AlertTriangle className="text-yellow-500" />,
    title: "Early Prevention (Elevated BP)",
    tips: [
      "Reduce caffeine and processed foods",
      "Increase potassium-rich fruits and vegetables",
      "Walk 30 mins daily",
      "Limit alcohol to ≤2 drinks/day",
      "Schedule annual BP checks"
    ]
  });
} else if ((systolic < 140 && diastolic < 90) || (systolic >= 130 && systolic < 140)) {
  recommendations.push({
    icon: <Activity className="text-orange-500" />,
    title: "Stage 1 Hypertension Care",
    tips: [
      "Adopt the DASH diet (low sodium, high fiber)",
      "Check BP at home 2–3 times per week",
      "Practice yoga/meditation for stress",
      "Discuss lifestyle changes with a doctor",
      "Limit red meat and added sugars"
    ]
  });
} else if ((systolic < 180 && diastolic < 120) || (systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
  recommendations.push({
    icon: <Heart className="text-red-500" />,
    title: "Stage 2 Hypertension Protocol",
    tips: [
      "Strictly reduce sodium (<1500mg/day)",
      "Take prescribed BP medication consistently",
      "Avoid high-intensity exercise until cleared",
      "Regularly monitor BP (daily if possible)",
      "Follow up with doctor every 1–3 months"
    ]
  });
} else if (systolic >= 180 || diastolic >= 120) {
  recommendations.push({
    icon: <AlertTriangle className="text-red-700" />,
    title: "Hypertensive Crisis – Emergency",
    tips: [
      "Seek immediate medical care (call 911/ER)",
      "Do not self-medicate or ignore symptoms",
      "Bring a log of recent BP readings to the ER",
      "Rest while waiting for emergency help",
      "Avoid stress or exertion"
    ]
  });
}

    return recommendations;
  };

  const getHeartRateTips = (): Recommendation[] => {
    if (!vitalData) return [];
    
    const { heartRate } = vitalData;
    const tips: Recommendation[] = [];
    
    if (heartRate > 100) {
      tips.push({
        icon: <Activity className="text-red-500" />,
        title: "High Heart Rate",
        advice: [
          "Practice deep breathing exercises",
          "Avoid caffeine and stimulants",
          "Stay hydrated with cool water",
          "Rest in a cool environment"
        ]
      });
    } else if (heartRate < 60) {
      tips.push({
        icon: <Heart className="text-blue-500" />,
        title: "Low Heart Rate",
        advice: [
          "Avoid sudden position changes",
          "Increase electrolyte intake",
          "Monitor for dizziness",
          "Consult cardiologist if persistent"
        ]
      });
    }
    
    return tips;
  };

  const getLifestyleSpecificTips = (): Recommendation[] => {
    const tips: Recommendation[] = [];
    
    if (lifestyle.alcohol) {
      tips.push({
        icon: <Wine className="text-purple-500" />,
        title: "Alcohol Moderation",
        advice: [
          "Limit to 1 drink/day for women",
          "Avoid binge drinking",
          "Choose low-sodium mixers",
          "Hydrate between drinks"
        ]
      });
    }
    
    if (lifestyle.smoking) {
      tips.push({
        icon: <Cigarette className="text-red-500" />,
        title: "Smoking Cessation",
        advice: [
          "Try nicotine replacement therapy",
          "Avoid smoking triggers",
          "Join support group",
          "Practice breathing exercises"
        ]
      });
    }
    
    if (lifestyle.caffeine > 3) {
      tips.push({
        icon: <Coffee className="text-amber-600" />,
        title: "Caffeine Management",
        advice: [
          "Switch to decaf after 2 cups",
          "Avoid energy drinks",
          "Monitor BP after consumption",
          "Try herbal alternatives"
        ]
      });
    }
    
    return tips;
  };

  const allRecommendations = [
    ...getBPRecommendations(),
    ...getHeartRateTips(),
    ...getLifestyleSpecificTips()
  ];

  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="text-red-500" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">Hypertension Lifestyle Guide</h3>
      </div>

      {vitalData && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          vitalData.status === 'alert' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
        }`}>
          <div className="flex items-center gap-2">
            {vitalData.status === 'alert' ? (
              <AlertTriangle className="text-red-600" size={20} />
            ) : (
              <CheckCircle className="text-green-600" size={20} />
            )}
            <p className="text-sm font-medium">
              Current Status: {vitalData.systolic}/{vitalData.diastolic} mmHg • 
              Heart Rate: {vitalData.heartRate} BPM
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Existing Inputs Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Lifestyle Factors</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={lifestyle.alcohol}
          onChange={(e) => {
            setLifestyle({ ...lifestyle, alcohol: e.target.checked });
            setRefreshTrigger(prev => prev + 1);
          }}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Wine className="text-purple-600" size={16} />
              <span className="text-sm text-gray-700">Alcohol Consumption</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={lifestyle.smoking}
          onChange={(e) => {
            setLifestyle({ ...lifestyle, smoking: e.target.checked });
            setRefreshTrigger(prev => prev + 1);
          }}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Cigarette className="text-purple-600" size={16} />
              <span className="text-sm text-gray-700">Tobacco Use</span>
            </label>
            <div className="flex items-center gap-3">
              <Coffee className="text-purple-600" size={16} />
              <label className="text-sm text-gray-700">Daily Caffeine:</label>
              <input
                type="number"
                min="0"
                max="10"
                value={lifestyle.caffeine}
          onChange={(e) => {
            setLifestyle({ ...lifestyle, caffeine: parseInt(e.target.value) || 0 });
            setRefreshTrigger(prev => prev + 1); // Trigger vital refresh after change
          }}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Recommendations Preview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Personalized Guidance</h4>
          <div className="space-y-4">
            {allRecommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {rec.icon}
                  <span className="text-sm font-medium">{rec.title}</span>
                </div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {rec.tips?.map((tip: string, i: number) => (
                    <li key={i} className="text-gray-600">{tip}</li>
                  ))}
                  {rec.advice?.map((advice: string, i: number) => (
                    <li key={i} className="text-gray-600">{advice}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Recommendations */}
      {allRecommendations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Recommendations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allRecommendations.map((rec, index) => (
              <div 
                key={index}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSection(expandedSection === `rec-${index}` ? null : `rec-${index}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rec.icon}
                    <span className="text-sm font-medium">{rec.title}</span>
                  </div>
                  <ChevronDown className={`transform transition-transform ${
                    expandedSection === `rec-${index}` ? 'rotate-180' : ''
                  }`} size={16} />
                </div>
                
                {expandedSection === `rec-${index}` && (
                  <ul className="mt-2 pl-5 space-y-2 text-sm text-gray-600">
                    {rec.tips?.map((tip: string, i: number) => (
                      <li key={i} className="list-disc">{tip}</li>
                    ))}
                    {rec.advice?.map((advice: string, i: number) => (
                      <li key={i} className="list-disc">{advice}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
