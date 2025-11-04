import React, { useState } from 'react';
import { Button } from '@repo/ui';
import { X, Send, Mail, AlertCircle } from 'lucide-react';
import { Doctor } from './admin/DoctorsMangement';

interface EmailCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDoctors: Doctor[];
  onSendCommunication: (subject: string, message: string) => Promise<void>;
}

const EmailCommunication: React.FC<EmailCommunicationModalProps> = ({
  isOpen,
  onClose,
  selectedDoctors,
  onSendCommunication,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }

    if (selectedDoctors.length === 0) {
      setError('No doctors selected');
      return;
    }

    setIsSending(true);
    try {
      await onSendCommunication(subject.trim(), message.trim());
      setSubject('');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error sending communication:', error);
      setError(error.message || 'Failed to send communication. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSubject('');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Mail className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Send Communication
              </h2>
              <p className="text-sm text-gray-500">
                {selectedDoctors.length} doctor{selectedDoctors.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSending}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selected Doctors Preview */}
          {selectedDoctors.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Sending to:
              </h3>
              <div className="max-h-32 overflow-y-auto">
                {selectedDoctors.map((doctor) => (
                  <div key={doctor._id} className="text-sm text-blue-700 py-1">
                    Dr. {doctor.firstName} {doctor.lastName} ({doctor.email})
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email subject..."
              required
              disabled={isSending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your message to the doctors..."
              required
              disabled={isSending}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              This will send individual emails to {selectedDoctors.length} doctor{selectedDoctors.length !== 1 ? 's' : ''}
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={handleClose}
                className="bg-gray-500 hover:bg-gray-600 text-white"
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSending || !subject.trim() || !message.trim() || selectedDoctors.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="mr-2" />
                {isSending ? `Sending to ${selectedDoctors.length} doctors...` : 'Send Communication'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailCommunication;