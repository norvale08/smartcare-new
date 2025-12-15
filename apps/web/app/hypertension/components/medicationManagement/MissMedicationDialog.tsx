// FILE: apps/web/app/patient/components/MissMedicationDialog.tsx
import React, { useState } from 'react';

interface MissMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isEnglish: () => boolean;
}

const MissMedicationDialog: React.FC<MissMedicationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isEnglish
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert(isEnglish() ? 'Please provide a reason for missing' : 'Tafadhali toa sababu ya kupitwa');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <h5 className="font-medium text-red-800 mb-2">
        {isEnglish() ? 'Why did you miss this medication?' : 'Kwa nini umepitwa na dawa hii?'}
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-red-700 mb-1">
            {isEnglish() ? 'Reason *' : 'Sababu *'}
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">{isEnglish() ? 'Select a reason' : 'Chagua sababu'}</option>
            <option value="forgot">{isEnglish() ? 'Forgot to take' : 'Nimesahau kunywa'}</option>
            <option value="not_available">{isEnglish() ? 'Medication not available' : 'Dawa haipo'}</option>
            <option value="side_effects">{isEnglish() ? 'Due to side effects' : 'Kutokana na athari'}</option>
            <option value="felt_better">{isEnglish() ? 'Felt better' : 'Nilijisikia vizuri'}</option>
            <option value="other">{isEnglish() ? 'Other' : 'Nyingine'}</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            {isEnglish() ? 'Cancel' : 'Ghairi'}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            {isEnglish() ? 'Confirm Missed' : 'Thibitisha Kupitwa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissMedicationDialog;