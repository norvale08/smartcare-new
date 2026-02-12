// apps/web/app/components/diabetesPages/components/GlucoseSection.tsx

import React from "react";
import { Input, Label } from "@repo/ui";
import { Droplet } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface GlucoseContextSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  getFieldStyle: (fieldName: string) => React.CSSProperties;
}

const GlucoseContextSection: React.FC<GlucoseContextSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  getFieldStyle
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <Droplet className="text-white" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-900">
            {currentLanguage.glucoseTitle || "Blood Glucose & Context"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {currentLanguage.glucoseSubtitle || "Provide your recent glucose reading and measurement context."}
          </p>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Glucose Input */}
        <div
          ref={setFieldRef("glucose")}
          style={getFieldStyle("glucose")}
          className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100 hover:bg-cyan-50/50 transition-colors"
        >
          <Label htmlFor="glucose" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
            {currentLanguage.glucoseLabel || "Glucose Level"} <span className="text-emerald-600">*</span>
          </Label>
          <Input
            type="number"
            id="glucose"
            placeholder={currentLanguage.glucosePlaceholder || "Enter glucose"}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
            {...register("glucose", validationRules.glucose)}
          />
          {errors.glucose && (
            <p className="text-red-600 text-xs mt-1 font-medium">{errors.glucose.message}</p>
          )}
        </div>

        {/* Measurement Context */}
        <div
          ref={setFieldRef("context")}
          style={getFieldStyle("context")}
          className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100 hover:bg-cyan-50/50 transition-colors"
        >
          <Label htmlFor="context" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
            {currentLanguage.contextLabel || "Measurement Context"} <span className="text-emerald-600">*</span>
          </Label>
          <select
            id="context"
            {...register("context", validationRules.context)}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm sm:text-base bg-white cursor-pointer focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="">{currentLanguage.contextOptions?.empty || "Select context"}</option>
            <option value="Fasting">{currentLanguage.contextOptions?.fasting || "Fasting"}</option>
            <option value="Post-meal">{currentLanguage.contextOptions?.postMeal || "Post-meal"}</option>
            <option value="Random">{currentLanguage.contextOptions?.random || "Random"}</option>
          </select>
          {errors.context && (
            <p className="text-red-600 text-xs mt-1 font-medium">{errors.context.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlucoseContextSection;