// apps/web/app/components/diabetesPages/components/SubmitButton.tsx
import React from 'react';
import { Button } from "@repo/ui";

interface SubmitButtonProps {
  isLoading: boolean;
  currentLanguage: any;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading,
  currentLanguage
}) => {
  return (
    <Button 
      type="submit" 
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm sm:text-base md:text-lg font-bold py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{currentLanguage.submitting}</span>
        </span>
      ) : (
        currentLanguage.submit
      )}
    </Button>
  );
};

export default SubmitButton;