// apps/web/app/components/diabetesPages/components/GlucoseSection.tsx
import React from 'react';
import { Input, Label } from "@repo/ui";
import { Droplet } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface GlucoseSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  fieldStyle: React.CSSProperties;
}

const GlucoseSection: React.FC<GlucoseSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  fieldStyle
}) => {
  return (
    <div 
      ref={setFieldRef('glucose')}
      style={fieldStyle}
      className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-all"
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <Droplet className="text-white" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.glucoseTitle}</h2>
          <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.glucoseSubtitle}</p>
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-blue-100">
        <Label htmlFor="glucose" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
          {currentLanguage.glucoseLabel} <span className="text-gray-400 text-xs">(Optional)</span>
        </Label>
        <Input 
          type="number" 
          id="glucose" 
          placeholder={currentLanguage.glucosePlaceholder} 
          className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          {...register("glucose", validationRules.glucose)} 
        />
        {errors.glucose && <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{errors.glucose.message}</p>}
      </div>
    </div>
  );
};

export default GlucoseSection;