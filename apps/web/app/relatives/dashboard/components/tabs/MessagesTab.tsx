// relative/dashboard/components/tabs/MessagesTab.tsx
import { PatientInfo, User } from '../../types';

interface MessagesTabProps {
  patientData: PatientInfo | null;
  user: User;
  message: string;
  sendingMessage: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export function MessagesTab({
  patientData,
  user,
  message,
  sendingMessage,
  onMessageChange,
  onSendMessage
}: MessagesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Message Form */}
      <div className="lg:col-span-2 order-1">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            Send Message to {patientData?.name?.split(' ')[0] || 'Patient'}
          </h3>

          <form onSubmit={onSendMessage} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder={`Type your message to ${patientData?.name || 'the patient'}...`}
              rows={5}
              required
              disabled={sendingMessage}
              className="
                w-full
                px-3 py-2
                border border-gray-300 rounded-lg
                text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                resize-none
                disabled:bg-gray-50
              "
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingMessage || !user.monitoredPatient}
                className="
                  w-full sm:w-auto
                  px-5 py-2.5
                  bg-blue-600 text-white text-sm font-medium
                  rounded-lg
                  hover:bg-blue-700
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {sendingMessage ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Contact Info */}
      <div className="order-2">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            Contact Information
          </h3>

          {patientData ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Patient Name</p>
                <p className="font-medium text-gray-900">{patientData.name}</p>
              </div>

              {patientData.email && (
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 break-all">
                    {patientData.email}
                  </p>
                </div>
              )}

              {patientData.phoneNumber && (
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">
                    {patientData.phoneNumber}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Your Relationship</p>
                <p className="font-medium text-gray-900">
                  {user.relationship || 'Not specified'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Access Level: {user.accessLevel}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No contact information available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
