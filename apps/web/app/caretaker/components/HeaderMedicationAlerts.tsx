import React from 'react';
import { AlertTriangle, Clock, XCircle, ChevronDown, ChevronUp, CheckCircle, Plus, X } from 'lucide-react';
import { useExpiringMedications } from '../hooks/useExpiringMeications';

interface HeaderMedicationAlertsProps {
  onMedicationClick?: (patientId: string, medicationId: string) => void;
}

const HeaderMedicationAlerts: React.FC<HeaderMedicationAlertsProps> = ({ onMedicationClick }) => {
  const { data, loading, error } = useExpiringMedications();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showMedicationModal, setShowMedicationModal] = React.useState(false);

  console.log('🚨 HeaderMedicationAlerts - Data received:', { data, loading, error });

  if (loading) {
    return (
      <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg">
        <div className="animate-pulse">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        </div>
        <span className="text-sm text-gray-600">Loading medication alerts...</span>
      </div>
    );
  }

  if (error) {
    console.log('❌ HeaderMedicationAlerts - Error:', error);
    return (
      <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <span className="text-sm text-red-700">Error loading alerts</span>
      </div>
    );
  }

  if (!data || data.totalExpiring === 0) {
    return (
      <div className="flex items-center space-x-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-700">No medication alerts</span>
      </div>
    );
  }

  const handleAlertClick = (medications: any[]) => {
    if (medications.length > 0 && onMedicationClick) {
      const firstMed = medications[0];
      onMedicationClick(firstMed.patient._id || firstMed.patient.id, firstMed._id);
    }
  };

  const expiredCount = data.categorized.expired;
  const todayCount = data.categorized.expiringToday;
  const soonCount = data.categorized.expiringIn3Days;
  const weekCount = data.categorized.expiringIn7Days;

  const totalUrgent = expiredCount + todayCount + soonCount;

  if (totalUrgent === 0 && weekCount === 0) {
    return null;
  }

  // Medication Modal Component
  const MedicationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Expiring Medications</h2>
              <p className="text-sm text-gray-600">Detailed view of all expiring medications</p>
            </div>
          </div>
          <button
            onClick={() => setShowMedicationModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900">Today</p>
                  <p className="text-2xl font-bold text-orange-600">{todayCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-900">3 Days</p>
                  <p className="text-2xl font-bold text-yellow-600">{soonCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">This Week</p>
                  <p className="text-2xl font-bold text-blue-600">{weekCount}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Expiring Medications</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {data.medications.map((med) => {
                const daysUntilExpiry = med.endDate 
                  ? Math.ceil((new Date(med.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                
                let statusColor = 'text-gray-600';
                let statusIcon = null;
                let bgColor = 'bg-white';
                
                if (daysUntilExpiry !== null) {
                  if (daysUntilExpiry < 0) {
                    statusColor = 'text-red-600';
                    statusIcon = <XCircle className="w-5 h-5 text-red-600" />;
                    bgColor = 'bg-red-50 border-red-200';
                  } else if (daysUntilExpiry === 0) {
                    statusColor = 'text-orange-600';
                    statusIcon = <AlertTriangle className="w-5 h-5 text-orange-600" />;
                    bgColor = 'bg-orange-50 border-orange-200';
                  } else if (daysUntilExpiry <= 3) {
                    statusColor = 'text-yellow-600';
                    statusIcon = <Clock className="w-5 h-5 text-yellow-600" />;
                    bgColor = 'bg-yellow-50 border-yellow-200';
                  } else {
                    statusColor = 'text-blue-600';
                    statusIcon = <Clock className="w-5 h-5 text-blue-600" />;
                    bgColor = 'bg-blue-50 border-blue-200';
                  }
                }

                return (
                  <div 
                    key={med._id}
                    className={`flex items-center justify-between p-4 ${bgColor} border rounded-lg cursor-pointer hover:shadow-md transition-all`}
                    onClick={() => {
                      handleAlertClick([med]);
                      setShowMedicationModal(false);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      {statusIcon}
                      <div>
                        <p className="font-semibold text-gray-900">{med.medicationName}</p>
                        <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                        <p className="text-xs text-gray-500">Duration: {med.duration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${statusColor}`}>
                          {daysUntilExpiry !== null 
                            ? daysUntilExpiry < 0 
                              ? `${Math.abs(daysUntilExpiry)}d expired` 
                              : `${daysUntilExpiry}d left`
                            : 'No expiry date'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Patient: {med.patient.fullName}</p>
                      <p className="text-xs text-gray-500">{med.patient.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div className="text-left">
            <p className="text-sm font-medium text-red-800">
              Medication Alerts
            </p>
            <p className="text-xs text-red-700">
              {totalUrgent > 0 ? `${totalUrgent} urgent` : `${weekCount} expiring soon`}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowMedicationModal(true)}
          className="ml-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          title="View all expiring medications"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-1 rounded-full hover:bg-red-100 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-red-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-red-600" />
          )}
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-red-200 rounded-lg shadow-lg z-50">
            <div className="p-4 space-y-3">
              {/* Expired Medications */}
              {expiredCount > 0 && (
                <div 
                  className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-600 rounded cursor-pointer hover:bg-red-100 transition-colors"
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
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Expired Medications</p>
                      <p className="text-sm text-red-700">{expiredCount} medication{expiredCount > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-800">{expiredCount}</span>
                </div>
              )}

              {/* Expiring Today */}
              {todayCount > 0 && (
                <div 
                  className="flex items-center justify-between p-3 bg-orange-50 border-l-4 border-orange-600 rounded cursor-pointer hover:bg-orange-100 transition-colors"
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
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">Expiring Today</p>
                      <p className="text-sm text-orange-700">{todayCount} medication{todayCount > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-orange-800">{todayCount}</span>
                </div>
              )}

              {/* Expiring Soon (3 days) */}
              {soonCount > 0 && (
                <div 
                  className="flex items-center justify-between p-3 bg-yellow-50 border-l-4 border-yellow-600 rounded cursor-pointer hover:bg-yellow-100 transition-colors"
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
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">Expiring in 3 Days</p>
                      <p className="text-sm text-yellow-700">{soonCount} medication{soonCount > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-yellow-800">{soonCount}</span>
                </div>
              )}

              {/* Expiring in 7 days */}
              {weekCount > 0 && (
                <div 
                  className="flex items-center justify-between p-3 bg-blue-50 border-l-4 border-blue-500 rounded cursor-pointer hover:bg-blue-100 transition-colors"
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
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-blue-900">Expiring This Week</p>
                      <p className="text-sm text-blue-700">{weekCount} medication{weekCount > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-800">{weekCount}</span>
                </div>
              )}

              {/* Show detailed medication list */}
              {data.medications.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Medication Details</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.medications.map((med) => {
                      const daysUntilExpiry = med.endDate 
                        ? Math.ceil((new Date(med.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      let statusColor = 'text-gray-600';
                      let statusIcon = null;
                      
                      if (daysUntilExpiry !== null) {
                        if (daysUntilExpiry < 0) {
                          statusColor = 'text-red-600';
                          statusIcon = <XCircle className="w-4 h-4 text-red-600" />;
                        } else if (daysUntilExpiry === 0) {
                          statusColor = 'text-orange-600';
                          statusIcon = <AlertTriangle className="w-4 h-4 text-orange-600" />;
                        } else if (daysUntilExpiry <= 3) {
                          statusColor = 'text-yellow-600';
                          statusIcon = <Clock className="w-4 h-4 text-yellow-600" />;
                        } else {
                          statusColor = 'text-blue-600';
                          statusIcon = <Clock className="w-4 h-4 text-blue-600" />;
                        }
                      }

                      return (
                        <div 
                          key={med._id}
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => handleAlertClick([med])}
                        >
                          <div className="flex items-center space-x-3">
                            {statusIcon}
                            <div>
                              <p className="font-medium text-sm">{med.medicationName}</p>
                              <p className="text-xs text-gray-600">{med.patient.fullName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${statusColor}`}>
                              {daysUntilExpiry !== null 
                                ? daysUntilExpiry < 0 
                                  ? `${Math.abs(daysUntilExpiry)}d expired` 
                                  : `${daysUntilExpiry}d left`
                                : 'No expiry date'}
                            </p>
                            <p className="text-xs text-gray-500">{med.dosage}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render the modal when showMedicationModal is true */}
      {showMedicationModal && <MedicationModal />}
    </>
  );
};

export default HeaderMedicationAlerts;