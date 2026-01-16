// relative/dashboard/components/AccessNotice.tsx
import { User } from '../types';

interface AccessNoticeProps {
  user: User;
}

export function AccessNotice({ user }: AccessNoticeProps) {
  return (
    <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-yellow-400">ℹ️</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Access Notice</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your access level: <strong>{user.accessLevel}</strong>.
              {user.accessLevel === 'view_only' && ' You can view information but cannot make changes.'}
              {user.accessLevel === 'caretaker' && ' You can view information and communicate with the patient.'}
              {user.accessLevel === 'emergency_only' && ' You only have access to emergency contact information.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}