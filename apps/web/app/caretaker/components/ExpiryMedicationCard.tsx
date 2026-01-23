import React from 'react';
import { Calendar, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { 
  getMedicationExpiryColor, 
  getExpiryStatusText, 
  getExpiryBadgeColor 
} from '../utils/medicationColors';

interface ExpiryMedicationCardProps {
  medication: {
    _id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    status: string;
    startDate: string;
    endDate?: string;
    patient?: {
      fullName: string;
      email: string;
    };
  };
  onClick?: () => void;
}

const ExpiryMedicationCard: React.FC<ExpiryMedicationCardProps> = ({ medication, onClick }) => {
  // Calculate days until expiry
  const daysUntilExpiry = medication.endDate 
    ? Math.ceil((new Date(medication.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const bgColor = getMedicationExpiryColor(daysUntilExpiry);
  const statusText = getExpiryStatusText(daysUntilExpiry);
  const badgeColor = getExpiryBadgeColor(daysUntilExpiry);

  return (
    <div
      className={`${bgColor} border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {medication.medicationName}
          </h3>
          {medication.patient && (
            <p className="text-sm text-gray-600 mt-1">
              Patient: {medication.patient.fullName}
            </p>
          )}
        </div>
        
        {/* Status Badge */}
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColor}`}>
          {statusText}
        </span>
      </div>

      {/* Medication Details */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-700">
          <span className="font-medium min-w-[80px]">Dosage:</span>
          <span>{medication.dosage}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-700">
          <span className="font-medium min-w-[80px]">Frequency:</span>
          <span>{medication.frequency}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-700">
          <span className="font-medium min-w-[80px]">Duration:</span>
          <span>{medication.duration}</span>
        </div>
      </div>

      {/* Expiry Warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="flex items-center text-sm">
            {daysUntilExpiry < 0 ? (
              <XCircle className="w-4 h-4 text-red-600 mr-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
            )}
            <span className={`font-medium ${
              daysUntilExpiry < 0 ? 'text-red-700' : 
              daysUntilExpiry === 0 ? 'text-orange-700' : 
              'text-yellow-700'
            }`}>
              {daysUntilExpiry < 0 
                ? 'This prescription has expired!' 
                : daysUntilExpiry === 0
                ? 'Expires today - Renew now!'
                : `Expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`
              }
            </span>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          Started: {new Date(medication.startDate).toLocaleDateString()}
        </div>
        {medication.endDate && (
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Ends: {new Date(medication.endDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiryMedicationCard;