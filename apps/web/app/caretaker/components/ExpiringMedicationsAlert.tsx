
import React from 'react';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useExpiringMedications } from '../hooks/useExpiringMeications';

interface ExpiringMedicationsAlertProps {
  onMedicationClick?: (patientId: string, medicationId: string) => void;
}

const ExpiringMedicationsAlert: React.FC<ExpiringMedicationsAlertProps> = ({ onMedicationClick }) => {
  const { data, loading, refresh } = useExpiringMedications();

  if (loading || !data) return null;

  const hasAlerts = data.totalExpiring > 0;

  if (!hasAlerts) return null;

  const handleAlertClick = (medications: any[]) => {
    if (medications.length > 0 && onMedicationClick) {
      const firstMed = medications[0];
      onMedicationClick(firstMed.patient._id || firstMed.patient.id, firstMed._id);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Expired Medications */}
      {data.categorized.expired > 0 && (
        <div 
          className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => {
            const expiredMeds = data.medications.filter(m => {
              const daysUntilExpiry = m.endDate 
                ? Math.ceil((new Date(m.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;
              return daysUntilExpiry !== null && daysUntilExpiry < 0;
            });
            handleAlertClick(expiredMeds);
          }}
        >
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                {data.categorized.expired} Medication{data.categorized.expired > 1 ? 's' : ''} Expired
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Some prescriptions have expired. Click to view and renew if necessary.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Today */}
      {data.categorized.expiringToday > 0 && (
        <div 
          className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMeds = data.medications.filter(m => {
              if (!m.endDate) return false;
              const endDate = new Date(m.endDate);
              endDate.setHours(0, 0, 0, 0);
              return endDate.getTime() === today.getTime();
            });
            handleAlertClick(todayMeds);
          }}
        >
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">
                {data.categorized.expiringToday} Medication{data.categorized.expiringToday > 1 ? 's' : ''} Expiring Today
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                These prescriptions expire today. Click to view and take immediate action.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon (3 days) */}
      {data.categorized.expiringIn3Days > 0 && (
        <div 
          className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const threeDaysFromNow = new Date(today);
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            const soonMeds = data.medications.filter(m => {
              if (!m.endDate) return false;
              const endDate = new Date(m.endDate);
              return endDate > today && endDate <= threeDaysFromNow;
            });
            handleAlertClick(soonMeds);
          }}
        >
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">
                {data.categorized.expiringIn3Days} Medication{data.categorized.expiringIn3Days > 1 ? 's' : ''} Expiring in 3 Days
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                These prescriptions will expire soon. Click to view and consider renewing them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring in 7 days - Less urgent */}
      {data.categorized.expiringIn7Days > 0 && (
        <div 
          className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const threeDaysFromNow = new Date(today);
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            const sevenDaysFromNow = new Date(today);
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            const weekMeds = data.medications.filter(m => {
              if (!m.endDate) return false;
              const endDate = new Date(m.endDate);
              return endDate > threeDaysFromNow && endDate <= sevenDaysFromNow;
            });
            handleAlertClick(weekMeds);
          }}
        >
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">
                {data.categorized.expiringIn7Days} Medication{data.categorized.expiringIn7Days > 1 ? 's' : ''} Expiring This Week
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Plan ahead to renew these prescriptions. Click to view details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiringMedicationsAlert;