// app/caretaker/components/tabs/MessagesTab.tsx
import React from 'react';
import { Patient } from '../../types';
import { MessageSquare } from 'lucide-react';

interface MessagesTabProps {
  patient: Patient;
}

const MessagesTab: React.FC<MessagesTabProps> = ({ patient }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Communication</h3>
      <div className="space-y-4">
        <div className="text-center text-gray-500 py-8">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Messaging interface coming soon</p>
          <p className="text-sm">Communication with {patient.fullName}</p>
        </div>
      </div>
    </div>
  );
};

export default MessagesTab;