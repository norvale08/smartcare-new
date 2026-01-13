import React from 'react';

interface AISettingsSectionProps {
  requestAI: boolean;
  onToggleAI: () => void;
  currentLanguage: any;
}

const AISettingsSection: React.FC<AISettingsSectionProps> = ({
  requestAI,
  onToggleAI,
  currentLanguage
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">
      <div className="space-y-3 sm:space-y-4">
        <label className="flex items-center gap-2 sm:gap-3 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
          <input 
            type="checkbox" 
            checked={requestAI} 
            onChange={onToggleAI}
            className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500" 
          />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">{currentLanguage.aiInsights}</span>
        </label>
      </div>
    </div>
  );
};

export default AISettingsSection;