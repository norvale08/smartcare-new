// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/AllergySection.tsx
// ============================================

import React from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { Allergy } from './types';

interface AllergySectionProps {
  newAllergy: Allergy;
  allergies: Allergy[];
  onAllergyChange: (allergy: Allergy) => void;
  onAddAllergy: () => void;
  onRemoveAllergy: (index: number) => void;
}

const AllergySection: React.FC<AllergySectionProps> = ({
  newAllergy,
  allergies,
  onAllergyChange,
  onAddAllergy,
  onRemoveAllergy
}) => {
  return (
    <div className="border-t pt-6">
      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
        Patient Allergies
      </h3>
      
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={newAllergy.allergyName}
            onChange={(e) => onAllergyChange({ ...newAllergy, allergyName: e.target.value })}
            placeholder="Allergy name (e.g., Penicillin)"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <select
            value={newAllergy.severity}
            onChange={(e) => onAllergyChange({ ...newAllergy, severity: e.target.value as Allergy['severity'] })}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <input
          type="text"
          value={newAllergy.reaction}
          onChange={(e) => onAllergyChange({ ...newAllergy, reaction: e.target.value })}
          placeholder="Reaction (e.g., Rash, difficulty breathing)"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="text"
          value={newAllergy.notes}
          onChange={(e) => onAllergyChange({ ...newAllergy, notes: e.target.value })}
          placeholder="Additional notes (optional)"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          type="button"
          onClick={onAddAllergy}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Allergy
        </button>
      </div>

      {allergies.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Added Allergies ({allergies.length}):
          </p>
          {allergies.map((allergy, index) => (
            <div key={index} className="flex items-center justify-between bg-white border border-red-200 rounded-lg p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-900">{allergy.allergyName}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    allergy.severity === 'severe' ? 'bg-red-200 text-red-900' :
                    allergy.severity === 'moderate' ? 'bg-orange-200 text-orange-900' :
                    'bg-yellow-200 text-yellow-900'
                  }`}>
                    {allergy.severity}
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">{allergy.reaction}</p>
                {allergy.notes && <p className="text-xs text-red-600 mt-1">{allergy.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => onRemoveAllergy(index)}
                className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                title="Remove allergy"
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

export default AllergySection;