import React from "react";
import { Activity, User, Pill, Utensils, Globe } from "lucide-react";
import { useTranslation } from "../../../lib/TranslationContext";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  
  const tabs = [
    { id: 'vitals', label: t.common.vitals, icon: Activity },
    { id: 'doctor', label: t.common.doctor, icon: User },
    { id: 'medicine', label: t.common.medicine, icon: Pill },
    { id: 'lifestyle', label: t.common.lifestyleAndDiet, icon: Utensils },
    { id: 'maps', label: t.common.maps, icon: Globe }
  ];

  return (
    <div className="flex overflow-x-auto bg-white shadow-sm border-b">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <IconComponent className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;