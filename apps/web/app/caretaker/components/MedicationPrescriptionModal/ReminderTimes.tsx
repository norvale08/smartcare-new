// ============================================
// FILE: apps/web/app/caretaker/components/MedicationPrescriptionModal/ReminderTimes.tsx
// ============================================

import React from 'react';
import { Clock } from 'lucide-react';
import { reminderTimes } from './constants';

interface ReminderTimesProps {
  reminders: string[];
  onToggle: (time: string) => void;
}

const ReminderTimes: React.FC<ReminderTimesProps> = ({ reminders, onToggle }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Reminder Times
      </label>
      <div className="grid grid-cols-4 gap-2">
        {reminderTimes.map(time => (
          <button
            key={time}
            type="button"
            onClick={() => onToggle(time)}
            className={`flex items-center justify-center space-x-2 p-2 rounded-lg border text-sm transition-colors ${
              reminders.includes(time)
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </button>
        ))}
      </div>
      {reminders.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

export default ReminderTimes;