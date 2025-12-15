// FILE: apps/web/app/patient/components/SideEffectsSection.tsx
import React from 'react';
import { Info, MessageSquare } from 'lucide-react';

interface SideEffectsSectionProps {
  medication: any;
  showSideEffects: boolean;
  showReportSideEffect: boolean;
  selectedSideEffects: string[];
  newSideEffect: {
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes: string;
    intensity: 'mild' | 'moderate' | 'severe' | 'very severe';
  };
  onToggleSideEffect: () => void;
  onToggleReportEffect: () => void;
  onToggleSideEffectCheckbox: (effectName: string) => void;
  onSideEffectChange: (data: any) => void;
  onReportSideEffect: () => void;
  onCancelReport: () => void;
  isEnglish: () => boolean;
}

const SideEffectsSection: React.FC<SideEffectsSectionProps> = ({
  medication,
  showSideEffects,
  showReportSideEffect,
  selectedSideEffects,
  newSideEffect,
  onToggleSideEffect,
  onToggleReportEffect,
  onToggleSideEffectCheckbox,
  onSideEffectChange,
  onReportSideEffect,
  onCancelReport,
  isEnglish
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
      case 'very severe': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'common': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'uncommon': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rare': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!medication.potentialSideEffects || medication.potentialSideEffects.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-3">
      <button
        onClick={onToggleSideEffect}
        className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <Info className="w-4 h-4" />
        <span>
          {isEnglish()
            ? `Possible Side Effects (${medication.potentialSideEffects.length})`
            : `Athari Zinazowezekana (${medication.potentialSideEffects.length})`}
        </span>
        <span className="text-xs">{showSideEffects ? '▼' : '▶'}</span>
      </button>

      {showSideEffects && (
        <div className="mt-3 space-y-2 bg-orange-50 p-3 rounded border border-orange-200">
          <p className="text-xs text-gray-600 mb-2">
            {isEnglish()
              ? "Check any side effects you're experiencing:"
              : "Chagua athari zozote unazopata:"}
          </p>
          {medication.potentialSideEffects.map((effect: any, index: number) => {
            const effectObj = typeof effect === 'string' ? { name: effect, severity: 'common', description: '' } : effect;
            return (
              <label
                key={`${medication._id}-${effectObj.name}-${index}`}
                className="flex items-start space-x-3 p-2 hover:bg-orange-100 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSideEffects.includes(effectObj.name)}
                  onChange={() => onToggleSideEffectCheckbox(effectObj.name)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{effectObj.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effectObj.severity)}`}>
                      {effectObj.severity}
                    </span>
                  </div>
                  {effectObj.description && <p className="text-xs text-gray-600 mt-1">{effectObj.description}</p>}
                </div>
              </label>
            );
          })}
          
          {/* Report New Side Effect Button */}
          <div className="pt-2">
            <button
              onClick={onToggleReportEffect}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isEnglish() ? 'Report a new side effect' : 'Ripoti athari mpya'}</span>
            </button>
          
            {showReportSideEffect && (
              <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 mb-2">
                  {isEnglish() ? 'Report Side Effect' : 'Ripoti Athari'}
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {isEnglish() ? 'Side Effect Name *' : 'Jina la Athari *'}
                    </label>
                    <input
                      type="text"
                      value={newSideEffect.name}
                      onChange={(e) => onSideEffectChange({ ...newSideEffect, name: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder={isEnglish() ? 'e.g., Nausea, Headache' : 'mf., Kichefuchefu, Maumivu ya kichwa'}
                    />
                  </div>
          
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {isEnglish() ? 'Severity' : 'Ukali'}
                      </label>
                      <select
                        value={newSideEffect.severity}
                        onChange={(e) => onSideEffectChange({ ...newSideEffect, severity: e.target.value as 'mild' | 'moderate' | 'severe' })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="mild">{isEnglish() ? 'Mild' : 'Nyepesi'}</option>
                        <option value="moderate">{isEnglish() ? 'Moderate' : 'Wastani'}</option>
                        <option value="severe">{isEnglish() ? 'Severe' : 'Kali'}</option>
                      </select>
                    </div>
          
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {isEnglish() ? 'Intensity' : 'Mkubwa'}
                      </label>
                      <select
                        value={newSideEffect.intensity}
                        onChange={(e) => onSideEffectChange({ ...newSideEffect, intensity: e.target.value as 'mild' | 'moderate' | 'severe' | 'very severe' })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="mild">{isEnglish() ? 'Mild' : 'Nyepesi'}</option>
                        <option value="moderate">{isEnglish() ? 'Moderate' : 'Wastani'}</option>
                        <option value="severe">{isEnglish() ? 'Severe' : 'Kali'}</option>
                        <option value="very severe">{isEnglish() ? 'Very Severe' : 'Kali Sana'}</option>
                      </select>
                    </div>
                  </div>
          
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {isEnglish() ? 'Notes (optional)' : 'Maelezo (hiari)'}
                    </label>
                    <textarea
                      value={newSideEffect.notes}
                      onChange={(e) => onSideEffectChange({ ...newSideEffect, notes: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder={isEnglish() ? 'Describe the side effect...' : 'Elezea athari...'}
                    />
                  </div>
          
                  <div className="flex space-x-2">
                    <button
                      onClick={onCancelReport}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm"
                    >
                      {isEnglish() ? 'Cancel' : 'Ghairi'}
                    </button>
                    <button
                      onClick={onReportSideEffect}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      {isEnglish() ? 'Report' : 'Ripoti'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SideEffectsSection;