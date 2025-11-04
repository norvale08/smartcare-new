import React, { useState } from 'react';
import { Button } from '@repo/ui';
import { X, Send, Mail } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSending(true);
    try {
      await onSendCommunication(subject, message);
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending communication:', error);
    } finally {
      setIsSending(false);
    }
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
                {selectedDoctors.length} doctor(s) selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email subject..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your message to the doctors..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending || !subject.trim() || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} className="mr-2" />
              {isSending ? 'Sending...' : 'Send Communication'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailCommunication;