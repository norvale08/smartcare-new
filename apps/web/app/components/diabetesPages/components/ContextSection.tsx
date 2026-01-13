// apps/web/app/components/diabetesPages/components/ContextSection.tsx
import React from 'react';
import { Label } from "@repo/ui";
import { Clock } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface ContextSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  fieldStyle: React.CSSProperties;
}

const ContextSection: React.FC<ContextSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  fieldStyle
}) => {
  return (
    <div 
      ref={setFieldRef('context')}
      style={fieldStyle}
      className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <Clock className="text-white" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.contextTitle}</h2>
          <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.contextSubtitle}</p>
        </div>
      </div>
      <Label htmlFor="context" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
        {currentLanguage.contextLabel} <span className="text-red-500">*</span>
      </Label>
      <select 
        id="context" 
        {...register("context", validationRules.context)}
        className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
      >
        <option value="">{currentLanguage.contextOptions.empty}</option>
        <option value="Fasting">{currentLanguage.contextOptions.fasting}</option>
        <option value="Post-meal">{currentLanguage.contextOptions.postMeal}</option>
        <option value="Random">{currentLanguage.contextOptions.random}</option>
      </select>
      {errors.context && <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{errors.context.message}</p>}
    </div>
  );
};

export default ContextSection;