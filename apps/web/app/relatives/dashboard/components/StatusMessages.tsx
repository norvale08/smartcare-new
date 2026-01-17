// relative/dashboard/components/StatusMessages.tsx
import { CheckCircle, XCircle } from 'lucide-react';

interface StatusMessagesProps {
  error: string;
  success: string;
}

export function StatusMessages({ error, success }: StatusMessagesProps) {
  if (!error && !success) return null;

  return (
    <div className="mb-6 space-y-3">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 sm:p-5
                     bg-red-50 border border-red-200
                     text-red-700 rounded-lg"
        >
          <XCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span className="text-sm sm:text-base leading-relaxed">
            {error}
          </span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 p-4 sm:p-5
                     bg-green-50 border border-green-200
                     text-green-700 rounded-lg"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
          <span className="text-sm sm:text-base leading-relaxed">
            {success}
          </span>
        </div>
      )}
    </div>
  );
}
