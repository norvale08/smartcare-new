// apps/web/app/components/diabetesPages/components/CardiovascularSection.tsx
import React from 'react';
import { Input, Label } from "@repo/ui";
import { Heart, Clock } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface CardiovascularSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  getFieldStyle: (fieldName: string) => React.CSSProperties;
}

const CardiovascularSection: React.FC<CardiovascularSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  getFieldStyle
}) => {
  return (
    <div
      ref={setFieldRef('systolic')}
      style={getFieldStyle('systolic')}
      className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <Heart className="text-white" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
            {currentLanguage.cardioTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {currentLanguage.cardioSubtitle}
          </p>
        </div>
      </div>

      {/* Content wrapper – responsive grid */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 sm:p-4 md:p-5 mb-3 sm:mb-4">
        {/* Pro tip */}
        <div className="flex items-start gap-2 mb-3 sm:mb-4">
          <Clock className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
          <p className="text-xs sm:text-sm text-gray-700 flex-1">
            {currentLanguage.proTip}
          </p>
        </div>

        {/* Fields: horizontal on md+, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Systolic */}
          <div>
            <Label htmlFor="systolic" className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
              {currentLanguage.systolicLabel} <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Input
              type="number"
              id="systolic"
              placeholder={currentLanguage.systolicPlaceholder}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              {...register("systolic", validationRules.systolic)}
            />
            {errors.systolic && (
              <p className="text-red-600 text-xs mt-1 font-medium">{errors.systolic.message}</p>
            )}
          </div>

          {/* Diastolic */}
          <div>
            <Label htmlFor="diastolic" className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
              {currentLanguage.diastolicLabel} <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Input
              type="number"
              id="diastolic"
              placeholder={currentLanguage.diastolicPlaceholder}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              {...register("diastolic", validationRules.diastolic)}
            />
            {errors.diastolic && (
              <p className="text-red-600 text-xs mt-1 font-medium">{errors.diastolic.message}</p>
            )}
          </div>

          {/* Heart Rate */}
          <div>
            <Label htmlFor="heartRate" className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
              {currentLanguage.heartRateLabel} <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Input
              type="number"
              id="heartRate"
              placeholder={currentLanguage.heartRatePlaceholder}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              {...register("heartRate", validationRules.heartRate)}
            />
            {errors.heartRate && (
              <p className="text-red-600 text-xs mt-1 font-medium">{errors.heartRate.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardiovascularSection;
