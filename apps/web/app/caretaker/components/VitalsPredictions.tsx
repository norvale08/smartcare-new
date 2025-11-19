// components/VitalPredictions.tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { hypertensionPredictor, diabetesPredictor } from '../utils/predictionModels';

interface VitalReading {
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  heartRate?: number;
  timestamp: string;
}

interface VitalPredictionsProps {
  patient: {
    id: string;
    fullName: string;
    age: number;
    condition: 'hypertension' | 'diabetes' | 'both';
  };
  vitals: VitalReading[];
}

const VitalPredictions: React.FC<VitalPredictionsProps> = ({ patient, vitals }) => {
  const [predictions, setPredictions] = useState<{
    hypertension?: any;
    diabetes?: any;
  }>({});

  useEffect(() => {
    if (vitals.length === 0) return;
    
    const latestVitals = vitals[0]; // Most recent reading
    
    // Prepare historical data for trend analysis (excluding the latest reading)
    const historicalVitals = vitals.slice(1).map(v => ({
      systolic: v.systolic || 120,
      diastolic: v.diastolic || 80,
      heartRate: v.heartRate || 70,
      age: patient.age,
      glucose: v.glucose || 100
    }));
    
    if (latestVitals && (patient.condition === 'hypertension' || patient.condition === 'both')) {
      const hypertensionPred = hypertensionPredictor.predict({
        systolic: latestVitals.systolic || 120,
        diastolic: latestVitals.diastolic || 80,
        heartRate: latestVitals.heartRate || 70,
        age: patient.age
      }, historicalVitals.length > 0 ? historicalVitals : undefined);
      setPredictions(prev => ({ ...prev, hypertension: hypertensionPred }));
    }

    if (latestVitals && latestVitals.glucose && (patient.condition === 'diabetes' || patient.condition === 'both')) {
      const diabetesPred = diabetesPredictor.predict({
        glucose: latestVitals.glucose,
        age: patient.age,
        systolic: latestVitals.systolic || 120,
        diastolic: latestVitals.diastolic || 80,
        heartRate: latestVitals.heartRate || 70
      }, historicalVitals.length > 0 ? historicalVitals : undefined);
      setPredictions(prev => ({ ...prev, diabetes: diabetesPred }));
    }
  }, [patient, vitals]);

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
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↑';
      case 'decreasing': return '↓';
      case 'stable': return '→';
      default: return '→';
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

  const renderTrendSection = (prediction: any) => {
    if (!prediction?.trends) return null;
    
    return (
      <div className="mt-4 pt-4 border-t">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Trend Analysis</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {prediction.trends.systolicTrend && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blood Pressure:</span>
              <span className={`font-medium ${getTrendColor(prediction.trends.systolicTrend)}`}>
                {getTrendIcon(prediction.trends.systolicTrend)} {prediction.trends.systolicTrend}
              </span>
            </div>
          )}
          {prediction.trends.glucoseTrend && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Glucose:</span>
              <span className={`font-medium ${getTrendColor(prediction.trends.glucoseTrend)}`}>
                {getTrendIcon(prediction.trends.glucoseTrend)} {prediction.trends.glucoseTrend}
              </span>
            </div>
          )}
          {prediction.trends.heartRateTrend && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Heart Rate:</span>
              <span className={`font-medium ${getTrendColor(prediction.trends.heartRateTrend)}`}>
                {getTrendIcon(prediction.trends.heartRateTrend)} {prediction.trends.heartRateTrend}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper function to safely get trend between two vital readings
  const getVitalTrend = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined) return null;
    
    if (current > previous) return 'increasing';
    if (current < previous) return 'decreasing';
    return 'stable';
  };

  // Safely get vital values with proper typing
  const currentVitals: VitalReading | undefined = vitals[0];
  const previousVitals: VitalReading | undefined = vitals[1];

  const bpTrend = getVitalTrend(currentVitals?.systolic, previousVitals?.systolic);
  const glucoseTrend = getVitalTrend(currentVitals?.glucose, previousVitals?.glucose);
  const heartRateTrend = getVitalTrend(currentVitals?.heartRate, previousVitals?.heartRate);

  // Check if vital values exist for display
  const hasBloodPressure = currentVitals?.systolic !== undefined && currentVitals?.diastolic !== undefined;
  const hasGlucose = currentVitals?.glucose !== undefined;
  const hasHeartRate = currentVitals?.heartRate !== undefined;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Health Risk Predictions
      </h3>

      <div className="space-y-4">
        {predictions.hypertension && (
          <div className={`p-4 rounded-lg border ${getRiskColor(predictions.hypertension.riskLevel)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getRiskIcon(predictions.hypertension.riskLevel)}
              <h4 className="font-medium">Hypertension Risk</h4>
              <span className="ml-auto text-sm font-semibold">
                {Math.round(predictions.hypertension.probability * 100)}% probability
              </span>
            </div>
            <p className="text-sm">{predictions.hypertension.recommendation}</p>
            {renderTrendSection(predictions.hypertension)}
          </div>
        )}

        {predictions.diabetes && (
          <div className={`p-4 rounded-lg border ${getRiskColor(predictions.diabetes.riskLevel)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getRiskIcon(predictions.diabetes.riskLevel)}
              <h4 className="font-medium">Diabetes Risk</h4>
              <span className="ml-auto text-sm font-semibold">
                {Math.round(predictions.diabetes.probability * 100)}% probability
              </span>
            </div>
            <p className="text-sm">{predictions.diabetes.recommendation}</p>
            {renderTrendSection(predictions.diabetes)}
          </div>
        )}

        {!predictions.hypertension && !predictions.diabetes && (
          <div className="text-center py-4 text-gray-500">
            No prediction data available. Ensure vital readings are complete.
          </div>
        )}
      </div>

      {/* Trend Analysis */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">Recent Vital Trends</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {bpTrend && (
            <div className="text-center p-3 bg-blue-50 rounded">
              <div>BP Trend</div>
              <div className={`font-semibold ${getTrendColor(bpTrend)}`}>
                {getTrendIcon(bpTrend)} {bpTrend}
              </div>
            </div>
          )}
          
          {glucoseTrend && (
            <div className="text-center p-3 bg-green-50 rounded">
              <div>Glucose Trend</div>
              <div className={`font-semibold ${getTrendColor(glucoseTrend)}`}>
                {getTrendIcon(glucoseTrend)} {glucoseTrend}
              </div>
            </div>
          )}

          {heartRateTrend && (
            <div className="text-center p-3 bg-purple-50 rounded">
              <div>Heart Rate Trend</div>
              <div className={`font-semibold ${getTrendColor(heartRateTrend)}`}>
                {getTrendIcon(heartRateTrend)} {heartRateTrend}
              </div>
            </div>
          )}

          {!bpTrend && !glucoseTrend && !heartRateTrend && (
            <div className="col-span-2 text-center p-3 bg-gray-50 rounded">
              <div>No trend data available</div>
              <div className="text-gray-500 text-xs">Need at least 2 vital readings</div>
            </div>
          )}
        </div>
      </div>

      {/* Current Vital Values */}
      {currentVitals && (hasBloodPressure || hasGlucose || hasHeartRate) && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Current Vital Values</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {hasBloodPressure && (
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-xs text-gray-600">Blood Pressure</div>
                <div className="font-semibold">
                  {currentVitals.systolic}/{currentVitals.diastolic} mmHg
                </div>
              </div>
            )}
            {hasGlucose && (
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-xs text-gray-600">Glucose</div>
                <div className="font-semibold">{currentVitals.glucose} mg/dL</div>
              </div>
            )}
            {hasHeartRate && (
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-xs text-gray-600">Heart Rate</div>
                <div className="font-semibold">{currentVitals.heartRate} bpm</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalPredictions;