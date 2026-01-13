import React from 'react';
import { 
  Activity, 
  TrendingUp, 
  Shield, 
  Bell,
  HeartPulse,
  Calendar,
  MessageSquare,
  Users,
  RefreshCw,
  Clock,
  User,
  PlusCircle,
  Pill,
  Phone
} from 'lucide-react';
import { Patient, VitalSigns } from '../types';
import CurrentVitalsTab from './tabs/CurrentVitalsTab';
import HealthTrendsTab from './tabs/HealthTrendsTab';
import HealthRiskAssessmentTab from './tabs/HealthRiskAssessmentTab';
import AlertsNotificationsTab from './tabs/AlertsNotificationsTab';
import PatientMessages from './PatientMessages';
import AppointmentsView from './AppointmentsView';
import DoctorMedicationManagement from './DoctorMedicationManagement';

interface PatientTabsProps {
  patient: Patient;
  patientVitals: VitalSigns[];
  isLoading: boolean;
  onRefreshVitals?: () => void;
  lastUpdated?: string;
  onPrescribeMedication?: (patientId: string) => void;
  onOpenMessaging?: () => void;
  activeTab: 'overview' | 'current-vitals' | 'health-trends' | 'risk-assessment' | 'alerts' | 'medications' | 'appointments' | 'messages';
  onTabChange: (tab: 'overview' | 'current-vitals' | 'health-trends' | 'risk-assessment' | 'alerts' | 'medications' | 'appointments' | 'messages') => void;
}

const PatientTabs: React.FC<PatientTabsProps> = ({
  patient,
  patientVitals,
  isLoading,
  onRefreshVitals,
  lastUpdated,
  onPrescribeMedication,
  onOpenMessaging,
  activeTab,
  onTabChange
}) => {
  // Tab definitions with proper icons and labels
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: User,
      description: 'Patient overview & quick actions'
    },
    {
      id: 'current-vitals',
      label: 'Current Vitals',
      icon: Activity,
      description: 'Latest vital signs'
    },
    {
      id: 'health-trends',
      label: 'Health Trends',
      icon: TrendingUp,
      description: 'Historical data analysis'
    },
    {
      id: 'risk-assessment',
      label: 'Risk Assessment',
      icon: Shield,
      description: 'Health risk evaluation'
    },
    {
      id: 'alerts',
      label: 'Alerts & Notifications',
      icon: Bell,
      description: 'Real-time updates'
    },
    {
      id: 'medications',
      label: 'Medications',
      icon: Pill,
      description: 'Prescribed treatments'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      description: 'Scheduled visits'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      description: 'Patient communication'
    }
  ];

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Patient Overview</h3>
                <p className="text-sm text-gray-500">General patient information and quick actions</p>
              </div>
            </div>
            
            {/* Patient Summary Card */}
            <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 p-6 rounded-lg border border-cyan-100 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{patient.fullName}</h4>
                  <p className="text-sm text-gray-600">{patient.age} years • {patient.gender}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      patient.condition === 'hypertension' ? 'bg-blue-100 text-blue-800' :
                      patient.condition === 'diabetes' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-cyan-100 text-cyan-800'
                    }`}>
                      {patient.condition}
                    </span>
                    <span className="text-xs text-gray-500">
                      Status: {patient.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last visit</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => onTabChange('current-vitals')}
                className="p-4 bg-white rounded-lg border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-900">View Vitals</h5>
                    <p className="text-xs text-gray-500">Latest vital signs</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onTabChange('medications')}
                className="p-4 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Pill className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-900">Medications</h5>
                    <p className="text-xs text-gray-500">Prescribed treatments</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onTabChange('appointments')}
                className="p-4 bg-white rounded-lg border border-cyan-100 hover:border-cyan-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                    <Calendar className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-900">Appointments</h5>
                    <p className="text-xs text-gray-500">Scheduled visits</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onTabChange('messages')}
                className="p-4 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-900">Messages</h5>
                    <p className="text-xs text-gray-500">Patient communication</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onTabChange('health-trends')}
                className="p-4 bg-white rounded-lg border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                    <TrendingUp className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-900">Health Trends</h5>
                    <p className="text-xs text-gray-500">Historical analysis</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onTabChange('risk-assessment')}
                className="p-4 bg-white rounded-lg border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                    <Shield className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium text-gray-900">Risk Assessment</h5>
                    <p className="text-xs text-gray-500">Health evaluation</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );
      case 'current-vitals':
        return (
          <CurrentVitalsTab
            patient={patient}
            patientVitals={patientVitals}
            isLoading={isLoading}
            onRefresh={onRefreshVitals}
            lastUpdated={lastUpdated}
          />
        );
      case 'health-trends':
        return (
          <HealthTrendsTab
            patient={patient}
            patientVitals={patientVitals}
          />
        );
      case 'risk-assessment':
        return (
          <HealthRiskAssessmentTab
            patient={patient}
            patientVitals={patientVitals}
          />
        );
      case 'alerts':
        return (
          <AlertsNotificationsTab
            patient={patient}
          />
        );
      case 'medications':
        return (
          <DoctorMedicationManagement 
            patient={{ id: patient.id, fullName: patient.fullName }} 
          />
        );
      case 'appointments':
        return (
          <AppointmentsView patient={patient} />
        );
      case 'messages':
        return (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Messages</h3>
                  <p className="text-sm text-gray-500">Conversation with {patient.fullName}</p>
                </div>
              </div>
              <button 
                onClick={onOpenMessaging}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Open Full View
              </button>
            </div>
            <PatientMessages selectedPatient={patient} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Tab Content only – navigation is handled from the sidebar */}
      <div className="p-6">{renderTabContent()}</div>
    </div>
  );
};

export default PatientTabs;
