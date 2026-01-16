// relative/dashboard/components/TabNavigation.tsx
import { Eye, Activity, Pill, MessageSquare, User } from 'lucide-react';
import { TabType } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Eye },
    { id: 'vitals' as TabType, label: 'Health Data', icon: Activity },
    { id: 'medications' as TabType, label: 'Medications', icon: Pill },
    { id: 'messages' as TabType, label: 'Messages', icon: MessageSquare },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-1">
      <nav className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}