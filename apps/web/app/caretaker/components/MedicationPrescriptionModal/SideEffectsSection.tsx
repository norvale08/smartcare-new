// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/SideEffectsSection.tsx
// ============================================

import React from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { SideEffect } from './types';

interface SideEffectsSectionProps {
  newSideEffect: SideEffect;
  sideEffects: SideEffect[];
  onSideEffectChange: (sideEffect: SideEffect) => void;
  onAddSideEffect: () => void;
  onRemoveSideEffect: (index: number) => void;
}

const SideEffectsSection: React.FC<SideEffectsSectionProps> = ({
  newSideEffect,
  sideEffects,
  onSideEffectChange,
  onAddSideEffect,
  onRemoveSideEffect
}) => {
  return (
    <div className="border-t pt-6">
      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
        <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
        Potential Side Effects
      </h3>
      
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={newSideEffect.name}
            onChange={(e) => onSideEffectChange({ ...newSideEffect, name: e.target.value })}
            placeholder="Side effect name (e.g., Dizziness)"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={newSideEffect.severity}
            onChange={(e) => onSideEffectChange({ ...newSideEffect, severity: e.target.value as SideEffect['severity'] })}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
          </select>
        </div>
        <input
          type="text"
          value={newSideEffect.description}
          onChange={(e) => onSideEffectChange({ ...newSideEffect, description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="button"
          onClick={onAddSideEffect}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Side Effect
        </button>
      </div>

      {sideEffects.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Added Side Effects ({sideEffects.length}):
          </p>
          {sideEffects.map((effect, index) => (
            <div key={index} className="flex items-center justify-between bg-white border border-orange-200 rounded-lg p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-orange-900">{effect.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    effect.severity === 'common' ? 'bg-yellow-200 text-yellow-900' :
                    effect.severity === 'uncommon' ? 'bg-orange-200 text-orange-900' :
                    'bg-gray-200 text-gray-900'
                  }`}>
                    {effect.severity}
                  </span>
                </div>
                {effect.description && <p className="text-sm text-orange-700 mt-1">{effect.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => onRemoveSideEffect(index)}
                className="ml-3 text-orange-600 hover:text-orange-800 transition-colors"
                title="Remove side effect"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SideEffectsSection;