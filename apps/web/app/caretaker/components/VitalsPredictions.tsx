// components/VitalsPredictions.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Heart, Droplets } from 'lucide-react';
import { hypertensionPredictor, diabetesPredictor } from '../utils/predictionModels';

interface VitalReading {
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  heartRate?: number;
  age: number;
  timestamp: string;
}

interface VitalPredictionsProps {
  patient: {
    id: string;
    fullName: string;
    age: number;
    condition: 'hypertension' | 'diabetes' | 'both' | undefined;
  };
  vitals: VitalReading[];
}

// Debounce function to prevent too many rapid predictions
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Simple fallback prediction without ML
const generateFallbackPredictions = (latestVitals: VitalReading) => {
  const fallback: any = {};
  
  if (latestVitals.systolic && latestVitals.diastolic) {
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let probability = 0.1;
    
    if (latestVitals.systolic >= 140 || latestVitals.diastolic >= 90) {
      riskLevel = 'high';
      probability = 0.8;
    } else if (latestVitals.systolic >= 130 || latestVitals.diastolic >= 85) {
      riskLevel = 'medium';
      probability = 0.5;
    }
    
    fallback.hypertension = {
      riskLevel,
      probability,
      recommendation: `Blood pressure ${latestVitals.systolic}/${latestVitals.diastolic} mmHg indicates ${riskLevel} hypertension risk. ${riskLevel === 'high' ? 'Immediate medical consultation recommended.' : 'Lifestyle modifications advised.'}`,
      trends: { systolicTrend: 'stable', diastolicTrend: 'stable', heartRateTrend: 'stable' }
    };
  }
  
  if (latestVitals.glucose) {
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let probability = 0.1;
    
    if (latestVitals.glucose >= 200) {
      riskLevel = 'high';
      probability = 0.9;
    } else if (latestVitals.glucose >= 126) {
      riskLevel = 'medium';
      probability = 0.6;
    } else if (latestVitals.glucose >= 100) {
      riskLevel = 'low';
      probability = 0.3;
    }
    
    fallback.diabetes = {
      riskLevel,
      probability,
      recommendation: `Glucose level ${latestVitals.glucose} mg/dL indicates ${riskLevel} diabetes risk. ${riskLevel === 'high' ? 'Urgent medical consultation and HbA1c test recommended.' : 'Dietary changes and regular monitoring advised.'}`,
      trends: { systolicTrend: 'stable', diastolicTrend: 'stable', glucoseTrend: 'stable', heartRateTrend: 'stable' }
    };
  }
  
  return fallback;
};

const VitalPredictions: React.FC<VitalPredictionsProps> = ({ patient, vitals }) => {
  const [predictions, setPredictions] = useState<{
    hypertension?: any;
    diabetes?: any;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized prediction function
  const makePredictions = useCallback(async () => {
    if (!vitals || vitals.length === 0) {
      setError('No vitals data available');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const latestVitals = vitals[0];
      if (!latestVitals) {
        setError('No valid vitals data');
        setIsLoading(false);
        return;
      }
      
      // Limit historical data to last 5 readings for performance
      const historicalVitals = vitals.slice(1, 6).map(v => ({
        systolic: v.systolic || 120,
        diastolic: v.diastolic || 80,
        heartRate: v.heartRate || 70,
        age: v.age || patient.age,
        glucose: v.glucose,
        bmi: 25
      }));

      // Check what data we have
      const hasBpData = latestVitals.systolic !== undefined && 
                       latestVitals.diastolic !== undefined &&
                       latestVitals.systolic !== null &&
                       latestVitals.diastolic !== null;
      
      const hasGlucoseData = latestVitals.glucose !== undefined && 
                            latestVitals.glucose !== null;

      // Run predictions in parallel with timeout
      const predictionPromises = [];

      if (hasBpData) {
        predictionPromises.push(
          hypertensionPredictor.predict({
            systolic: latestVitals.systolic!,
            diastolic: latestVitals.diastolic!,
            heartRate: latestVitals.heartRate || 70,
            age: latestVitals.age || patient.age,
            bmi: 25
          }, historicalVitals.length > 0 ? historicalVitals : undefined)
            .then(hypertensionPred => ({ type: 'hypertension', data: hypertensionPred }))
            .catch(error => {
              console.error('Hypertension prediction failed:', error);
              return { type: 'hypertension', data: null };
            })
        );
      }

      if (hasGlucoseData) {
        const diabetesHistoricalVitals = historicalVitals
          .filter(v => v.glucose !== undefined && v.glucose !== null)
          .slice(0, 3) // Limit to 3 readings for diabetes
          .map(v => ({
            ...v,
            glucose: v.glucose!
          }));

        predictionPromises.push(
          diabetesPredictor.predict({
            glucose: latestVitals.glucose!,
            age: latestVitals.age || patient.age,
            systolic: latestVitals.systolic || 120,
            diastolic: latestVitals.diastolic || 80,
            heartRate: latestVitals.heartRate || 70,
            bmi: 25
          }, diabetesHistoricalVitals.length > 0 ? diabetesHistoricalVitals : undefined)
            .then(diabetesPred => ({ type: 'diabetes', data: diabetesPred }))
            .catch(error => {
              console.error('Diabetes prediction failed:', error);
              return { type: 'diabetes', data: null };
            })
        );
      }

      if (predictionPromises.length === 0) {
        // No data for predictions, use fallback
        const fallbackPredictions = generateFallbackPredictions(latestVitals);
        setPredictions(fallbackPredictions);
        setIsLoading(false);
        return;
      }

      // Wait for all predictions with timeout
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 3000) // 3 second timeout
      );

      const results = await Promise.race([
        Promise.all(predictionPromises),
        timeoutPromise.then(() => {
          throw new Error('Prediction timeout - using quick assessment');
        })
      ]);

      // Update predictions state
      const newPredictions: any = {};
      results.forEach(result => {
        if (result && result.data) {
          newPredictions[result.type] = result.data;
        }
      });

      // If ML predictions failed, use fallback
      if (Object.keys(newPredictions).length === 0) {
        const fallbackPredictions = generateFallbackPredictions(latestVitals);
        setPredictions(fallbackPredictions);
      } else {
        setPredictions(newPredictions);
      }

    } catch (error) {
      console.error('Prediction error:', error);
      setError('Using quick health assessment');
      
      // Fallback to simple rule-based analysis - FIXED: Added null check
      if (vitals[0]) {
        const fallbackPredictions = generateFallbackPredictions(vitals[0]);
        setPredictions(fallbackPredictions);
      } else {
        setPredictions({});
      }
    } finally {
      setIsLoading(false);
    }
  }, [patient, vitals]);

  // Debounced prediction effect
  useEffect(() => {
    const debouncedPredict = debounce(makePredictions, 300);
    debouncedPredict();
  }, [makePredictions]);

  // Preload models when component mounts
  useEffect(() => {
    const preloadModels = async () => {
      try {
        await Promise.race([
          Promise.all([
            hypertensionPredictor.loadModel(),
            diabetesPredictor.loadModel()
          ]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Model loading timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.log('Model preloading failed, will use fallback when needed');
      }
    };

    preloadModels();
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <TrendingUp className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4" />;
      case 'decreasing': return <TrendingUp className="w-4 h-4 transform rotate-180" />;
      case 'stable': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getVitalStatus = (type: 'bp' | 'glucose' | 'hr', value: number) => {
    if (type === 'bp') {
      if (value >= 140) return 'high';
      if (value >= 120) return 'medium';
      return 'low';
    }
    if (type === 'glucose') {
      if (value >= 126) return 'high';
      if (value >= 100) return 'medium';
      return 'low';
    }
    if (type === 'hr') {
      if (value >= 100 || value <= 60) return 'medium';
      return 'low';
    }
    return 'low';
  };

  const renderTrendSection = (prediction: any) => {
    if (!prediction?.trends) return null;
    
    const { trends } = prediction;
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Trend Analysis</h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {trends.systolicTrend && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Blood Pressure
              </span>
              <span className={`font-medium flex items-center gap-1 ${getTrendColor(trends.systolicTrend)}`}>
                {getTrendIcon(trends.systolicTrend)}
                <span className="capitalize">{trends.systolicTrend}</span>
              </span>
            </div>
          )}
          {trends.glucoseTrend && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Droplets className="w-4 h-4" />
                Glucose
              </span>
              <span className={`font-medium flex items-center gap-1 ${getTrendColor(trends.glucoseTrend)}`}>
                {getTrendIcon(trends.glucoseTrend)}
                <span className="capitalize">{trends.glucoseTrend}</span>
              </span>
            </div>
          )}
          {trends.heartRateTrend && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Heart className="w-4 h-4" />
                Heart Rate
              </span>
              <span className={`font-medium flex items-center gap-1 ${getTrendColor(trends.heartRateTrend)}`}>
                {getTrendIcon(trends.heartRateTrend)}
                <span className="capitalize">{trends.heartRateTrend}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPredictionCard = (type: 'hypertension' | 'diabetes', prediction: any) => {
    if (!prediction) return null;

    const titles = {
      hypertension: 'Hypertension Risk',
      diabetes: 'Diabetes Risk'
    };

    const icons = {
      hypertension: <Activity className="w-5 h-5" />,
      diabetes: <Droplets className="w-5 h-5" />
    };

    return (
      <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${getRiskColor(prediction.riskLevel)}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            {icons[type]}
            <h4 className="font-semibold">{titles[type]}</h4>
          </div>
          <span className="text-sm font-bold bg-white px-2 py-1 rounded-full border">
            {Math.round(prediction.probability * 100)}%
          </span>
        </div>
        <p className="text-sm mb-2 leading-relaxed">{prediction.recommendation}</p>
        {renderTrendSection(prediction)}
      </div>
    );
  };

  // Get current vital values
  const currentVitals = vitals[0];
  const previousVitals = vitals[1];

  // Helper function to safely get trend between two vital readings
  const getVitalTrend = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined) return null;
    
    const diff = current - previous;
    if (Math.abs(diff) < 2) return 'stable';
    if (diff > 0) return 'increasing';
    return 'decreasing';
  };

  const bpTrend = getVitalTrend(currentVitals?.systolic, previousVitals?.systolic);
  const glucoseTrend = getVitalTrend(currentVitals?.glucose, previousVitals?.glucose);
  const heartRateTrend = getVitalTrend(currentVitals?.heartRate, previousVitals?.heartRate);

  // Check if vital values exist for display
  const hasBloodPressure = currentVitals?.systolic !== undefined && currentVitals?.diastolic !== undefined;
  const hasGlucose = currentVitals?.glucose !== undefined;
  const hasHeartRate = currentVitals?.heartRate !== undefined;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Health Risk Assessment
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing health risks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Health Risk Assessment
        </h3>
        {error && (
          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200">
            {error}
          </span>
        )}
      </div>

      {/* Predictions */}
      <div className="space-y-4 mb-6">
        {renderPredictionCard('hypertension', predictions.hypertension)}
        {renderPredictionCard('diabetes', predictions.diabetes)}
        
        {!predictions.hypertension && !predictions.diabetes && vitals.length > 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Insufficient data for predictions</p>
            <p className="text-sm mt-1">Ensure blood pressure and glucose readings are available</p>
          </div>
        )}

        {vitals.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No vital readings available</p>
            <p className="text-sm mt-1">Add vital readings to generate health predictions</p>
          </div>
        )}
      </div>

      {/* Current Vital Values */}
      {currentVitals && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Current Vital Readings
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {hasBloodPressure && (
              <div className={`p-3 rounded-lg border-2 ${
                getRiskColor(getVitalStatus('bp', currentVitals.systolic!))
              }`}>
                <div className="text-xs text-gray-600 mb-1">Blood Pressure</div>
                <div className="font-bold text-lg">
                  {currentVitals.systolic}/{currentVitals.diastolic}
                </div>
                <div className="text-xs text-gray-500">mmHg</div>
              </div>
            )}
            
            {hasGlucose && (
              <div className={`p-3 rounded-lg border-2 ${
                getRiskColor(getVitalStatus('glucose', currentVitals.glucose!))
              }`}>
                <div className="text-xs text-gray-600 mb-1">Glucose</div>
                <div className="font-bold text-lg">{currentVitals.glucose}</div>
                <div className="text-xs text-gray-500">mg/dL</div>
              </div>
            )}
            
            {hasHeartRate && (
              <div className={`p-3 rounded-lg border-2 ${
                getRiskColor(getVitalStatus('hr', currentVitals.heartRate!))
              }`}>
                <div className="text-xs text-gray-600 mb-1">Heart Rate</div>
                <div className="font-bold text-lg">{currentVitals.heartRate}</div>
                <div className="text-xs text-gray-500">bpm</div>
              </div>
            )}
            
            <div className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">Age</div>
              <div className="font-bold text-lg">{currentVitals.age || patient.age}</div>
              <div className="text-xs text-gray-500">years</div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      {(bpTrend || glucoseTrend || heartRateTrend) && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Vital Trends
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {bpTrend && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Blood Pressure</div>
                <div className={`font-semibold text-lg flex items-center justify-center gap-1 ${getTrendColor(bpTrend)}`}>
                  {getTrendIcon(bpTrend)}
                  <span className="capitalize">{bpTrend}</span>
                </div>
              </div>
            )}
            
            {glucoseTrend && (
              <div className="text-center p-3 bg-green-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Glucose</div>
                <div className={`font-semibold text-lg flex items-center justify-center gap-1 ${getTrendColor(glucoseTrend)}`}>
                  {getTrendIcon(glucoseTrend)}
                  <span className="capitalize">{glucoseTrend}</span>
                </div>
              </div>
            )}

            {heartRateTrend && (
              <div className="text-center p-3 bg-purple-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Heart Rate</div>
                <div className={`font-semibold text-lg flex items-center justify-center gap-1 ${getTrendColor(heartRateTrend)}`}>
                  {getTrendIcon(heartRateTrend)}
                  <span className="capitalize">{heartRateTrend}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalPredictions;