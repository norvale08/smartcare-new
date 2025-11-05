// app/caretaker/components/NavigationTabs.tsx
import React from 'react';

interface NavigationTabsProps {
  activeTab: "overview" | "vitals" | "messages";
  onTabChange: (tab: "overview" | "vitals" | "messages") => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "vitals", label: "Vitals" },
    { id: "messages", label: "Messages" },
  ] as const;

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default NavigationTabs;