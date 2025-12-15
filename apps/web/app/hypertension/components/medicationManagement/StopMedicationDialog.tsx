// FILE: apps/web/app/patient/components/StopMedicationDialog.tsx
import React, { useState } from 'react';

interface StopMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes?: string) => void;
  isEnglish: () => boolean;
}

const StopMedicationDialog: React.FC<StopMedicationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isEnglish
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert(isEnglish() ? 'Please provide a reason for stopping' : 'Tafadhali toa sababu ya kuacha');
      return;
    }
    onConfirm(reason, notes);
    setReason('');
    setNotes('');
  };

  const handleClose = () => {
    setReason('');
    setNotes('');
    onClose();
  };

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <h5 className="font-medium text-red-800 mb-2">
        {isEnglish() ? 'Why are you stopping this medication?' : 'Kwa nini unaacha kutumia dawa hii?'}
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
            <option value="side_effects">{isEnglish() ? 'Side effects' : 'Athari mbaya'}</option>
            <option value="feeling_better">{isEnglish() ? 'Feeling better' : 'Najisikia vizuri'}</option>
            <option value="forgot_to_take">{isEnglish() ? 'Forgot to take' : 'Nimesahau kunywa'}</option>
            <option value="too_expensive">{isEnglish() ? 'Too expensive' : 'Ni ghali sana'}</option>
            <option value="doctor_advised">{isEnglish() ? 'Doctor advised' : 'Daktari ameshauri'}</option>
            <option value="other">{isEnglish() ? 'Other' : 'Nyingine'}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-red-700 mb-1">
            {isEnglish() ? 'Additional notes (optional)' : 'Maelezo ya ziada (hiari)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder={isEnglish() ? 'Tell us more...' : 'Tuambie zaidi...'}
          />
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
            {isEnglish() ? 'Confirm Stop' : 'Thibitisha Kuacha'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StopMedicationDialog;