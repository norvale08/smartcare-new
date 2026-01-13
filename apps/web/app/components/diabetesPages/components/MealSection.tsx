// apps/web/app/components/diabetesPages/components/MealSection.tsx
import React from 'react';
import { Label } from "@repo/ui";
import { Utensils } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface MealSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  getFieldStyle: (fieldName: string) => React.CSSProperties;
}

const MealSection: React.FC<MealSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  getFieldStyle
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 mb-2 sm:mb-5">
        <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-emerald-700 rounded-md flex items-center justify-center shadow-md flex-shrink-0">
          <Utensils className="text-white" size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.mealTitle}</h2>
          <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.mealSubtitle}</p>
        </div>
      </div>

      {/* Grid container with proper spacing */}
      <div className="space-y-4 sm:space-y-6 md:space-y-0 md:grid md:grid-cols-2 sm:gap-6 md:gap-6">
        {/* Last Meal Time Field */}
        <div 
          ref={setFieldRef('lastMealTime')}
          style={getFieldStyle('lastMealTime')}
          className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100 hover:bg-gray-50/80 transition-colors"
        >
          <Label htmlFor="lastMealTime" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
            {currentLanguage.lastMealLabel} <span className="text-red-500">*</span>
          </Label>
          <select 
            id="lastMealTime"
            {...register("lastMealTime", validationRules.lastMealTime)} 
            className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-white"
          >
            <option value="">{currentLanguage.lastMealOptions.empty}</option>
            <option value="2_hours">{currentLanguage.lastMealOptions.twoHours}</option>
            <option value="4_hours">{currentLanguage.lastMealOptions.fourHours}</option>
            <option value="6_hours">{currentLanguage.lastMealOptions.sixHours}</option>
            <option value="more_than_6_hours">{currentLanguage.lastMealOptions.moreThanSix}</option>
          </select>
          {errors.lastMealTime && <p className="text-red-600 text-xs mt-1 font-medium">{errors.lastMealTime.message}</p>}
        </div>

        {/* Meal Type Field */}
        <div 
          ref={setFieldRef('mealType')}
          style={getFieldStyle('mealType')}
          className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100 hover:bg-gray-50/80 transition-colors"
        >
          <Label htmlFor="mealType" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
            {currentLanguage.mealTypeLabel} <span className="text-red-500">*</span>
          </Label>
          <select 
            id="mealType"
            {...register("mealType", validationRules.mealType)} 
            className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-white"
          >
            <option value="">{currentLanguage.mealTypeOptions.empty}</option>
            <option value="carbohydrates">{currentLanguage.mealTypeOptions.carbs}</option>
            <option value="sugary_drinks">{currentLanguage.mealTypeOptions.sugaryDrinks}</option>
            <option value="proteins">{currentLanguage.mealTypeOptions.proteins}</option>
            <option value="vegetables">{currentLanguage.mealTypeOptions.vegetables}</option>
            <option value="mixed_meal">{currentLanguage.mealTypeOptions.mixed}</option>
          </select>
          {errors.mealType && <p className="text-red-600 text-xs mt-1 font-medium">{errors.mealType.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default MealSection;