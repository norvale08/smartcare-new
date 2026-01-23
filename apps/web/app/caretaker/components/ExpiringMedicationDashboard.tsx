import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useExpiringMedications } from '../hooks/useExpiringMeications';
import ExpiryMedicationCard from './ExpiryMedicationCard';

interface ExpiringMedicationsDashboardProps {
  onMedicationClick?: (patientId: string, medicationId: string) => void;
}

const ExpiringMedicationsDashboard: React.FC<ExpiringMedicationsDashboardProps> = ({ onMedicationClick }) => {
  const { data, loading, refresh } = useExpiringMedications();
  const [expanded, setExpanded] = useState(true);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.totalExpiring === 0 || !data.medications || data.medications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-orange-500 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            Expiring Medications ({data.totalExpiring})
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {data.newAlerts > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {data.newAlerts} New
            </span>
          )}
          
          <button className="text-gray-500 hover:text-gray-700">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 border-t">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-700">
                {data.categorized.expired}
              </div>
              <div className="text-xs text-red-600 mt-1">Expired</div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {data.categorized.expiringToday}
              </div>
              <div className="text-xs text-orange-600 mt-1">Today</div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {data.categorized.expiringIn3Days}
              </div>
              <div className="text-xs text-yellow-600 mt-1">In 3 Days</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {data.categorized.expiringIn7Days}
              </div>
              <div className="text-xs text-blue-600 mt-1">This Week</div>
            </div>
          </div>

          {/* Medications List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.medications && data.medications.length > 0 ? (
              data.medications.map((medication) => (
                <ExpiryMedicationCard
                  key={medication._id}
                  medication={medication}
                  onClick={() => {
                    if (onMedicationClick && medication.patient?._id) {
                      onMedicationClick(medication.patient._id, medication._id);
                    }
                  }}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No expiring medications found</p>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={refresh}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Expiring Medications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiringMedicationsDashboard