import { User } from '../types';

interface AccessNoticeProps {
  user: User;
}

export function AccessNotice({ user }: AccessNoticeProps) {
  return (
    <div className="mt-6 sm:mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">

        {/* Icon */}
        <div className="flex-shrink-0 flex items-start justify-center">
          <span className="text-yellow-400 text-xl sm:text-2xl">ℹ️</span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-yellow-800">
            Access Notice
          </h3>

          <p className="mt-2 text-sm sm:text-base text-yellow-700 leading-relaxed">
            <span className="font-medium">Your access level:</span>{' '}
            <strong className="capitalize">{user.accessLevel.replace('_', ' ')}</strong>.
            {user.accessLevel === 'view_only' &&
              ' You can view information but cannot make changes.'}
            {user.accessLevel === 'caretaker' &&
              ' You can view information and communicate with the patient.'}
            {user.accessLevel === 'emergency_only' &&
              ' You only have access to emergency contact information.'}
          </p>
        </div>

      </div>
    </div>
  );
}
