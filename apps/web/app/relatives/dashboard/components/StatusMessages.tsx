// relative/dashboard/components/StatusMessages.tsx
interface StatusMessagesProps {
  error: string;
  success: string;
}

export function StatusMessages({ error, success }: StatusMessagesProps) {
  if (!error && !success) return null;

  return (
    <div className="mb-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}
    </div>
  );
}