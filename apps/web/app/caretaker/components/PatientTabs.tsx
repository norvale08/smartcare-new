// app/caretaker/components/PatientTabs.tsx
import React, { useState } from 'react';
import { Patient, VitalSigns } from '../types';
import OverviewTab from './tabs/OverviewTab';
import VitalsTab from './tabs/VitalsTab';
import MessagesTab from './tabs/MessagesTab';
import { Activity, TrendingUp, MessageSquare } from 'lucide-react';

interface PatientTabsProps {
  patient: Patient;
  patientVitals: VitalSigns[];
  isLoading: boolean;
}

const PatientTabs: React.FC<PatientTabsProps> = ({
  patient,
  patientVitals,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Activity,
      component: (
        <OverviewTab
          patient={patient}
          patientVitals={patientVitals}
          isLoading={isLoading}
        />
      ),
    },
    {
      id: 'vitals',
      label: 'Vitals History',
      icon: TrendingUp,
      component: <VitalsTab patientVitals={patientVitals} />,
    },
    // {
    //   id: 'messages',
    //   label: 'Messages',
    //   icon: MessageSquare,
    //   component: <MessagesTab patient={patient} />,
    // },
  ];

  return (
    <div className="bg-white rounded-lg border shadow-lg">
      {/* Tab Headers */}
      <div className="border-b">
        <div className="flex space-x-1 px-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default PatientTabs;