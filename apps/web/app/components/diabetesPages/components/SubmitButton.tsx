// apps/web/app/components/diabetesPages/components/SubmitButton.tsx
import React from 'react';
import { Send } from 'lucide-react';

interface SubmitButtonProps {
  isLoading: boolean;
  currentLanguage: any;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isLoading, currentLanguage }) => {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`
        w-full bg-blue-500
        text-white font-bold py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl 
        shadow-lg hover:shadow-xl transition-all duration-300 
        flex items-center justify-center gap-2 sm:gap-3
        text-sm sm:text-base md:text-lg
        ${isLoading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:scale-[1.02] active:scale-[0.98]'
        }
      `}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <span>{currentLanguage.submitting || "Submitting..."}</span>
        </>
      ) : (
        <>
          <Send size={20} />
          <span>{currentLanguage.submitButton || "Submit Vitals"}</span>
        </>
      )}
    </button>
  );
};

export default SubmitButton;