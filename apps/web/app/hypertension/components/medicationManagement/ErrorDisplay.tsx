// FILE: apps/web/app/patient/components/ErrorDisplay.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    </div>
  );
};

export default ErrorDisplay;