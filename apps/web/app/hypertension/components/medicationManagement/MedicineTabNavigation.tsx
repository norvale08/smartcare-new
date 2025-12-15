// FILE: apps/web/app/patient/components/TabNavigation.tsx
import React from 'react';
import { CalendarDays, Bell } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'today' | 'weekly';
  setActiveTab: (tab: 'today' | 'weekly') => void;
  isEnglish: () => boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab, isEnglish }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-4">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'weekly' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <CalendarDays className="inline-block w-4 h-4 mr-2" />
          {isEnglish() ? 'Weekly Calendar' : 'Kalenda ya Wiki'}
        </button>
        <button
          onClick={() => setActiveTab('today')}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'today' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Bell className="inline-block w-4 h-4 mr-2" />
          {isEnglish() ? 'Today\'s Reminders' : 'Kumbusho za Leo'}
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;