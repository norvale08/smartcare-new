// apps/web/app/components/diabetesPages/components/ExerciseSection.tsx

import React from "react";
import { Label } from "@repo/ui";
import { Dumbbell, Zap } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface ExerciseSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  getFieldStyle: (fieldName: string) => React.CSSProperties;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  getFieldStyle
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
          <Dumbbell className="text-white" size={18} />
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
            {currentLanguage.exerciseTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {currentLanguage.exerciseSubtitle}
          </p>
        </div>
      </div>

      {/* ================= IMPORTANT NOTE ================= */}
      <div className="flex items-start gap-2 mb-4 sm:mb-6 bg-green-50 rounded-lg p-3 border border-green-100">
        <Zap className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
        <p className="text-xs sm:text-sm text-gray-700">
          {currentLanguage.exerciseImportant}
        </p>
      </div>

      {/* ================= INPUT GRID ================= */}
      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">

        {/* ===== Recent Exercise ===== */}
        <div
          ref={setFieldRef("exerciseRecent")}
          style={getFieldStyle("exerciseRecent")}
          className="bg-gray-50 rounded-xl p-4 border border-gray-100"
        >
          <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
            {currentLanguage.exerciseRecentLabel}
            <span className="text-red-500"> *</span>
          </Label>

          <select
            {...register("exerciseRecent", validationRules.exerciseRecent)}
            className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm
                       focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white"
          >
            <option value="">{currentLanguage.exerciseOptions.empty}</option>
            <option value="none">{currentLanguage.exerciseOptions.none}</option>
            <option value="within_2_hours">
              {currentLanguage.exerciseOptions.within2Hours}
            </option>
            <option value="2_to_6_hours">
              {currentLanguage.exerciseOptions.twoToSixHours}
            </option>
            <option value="6_to_24_hours">
              {currentLanguage.exerciseOptions.sixTo24Hours}
            </option>
          </select>

          {errors.exerciseRecent && (
            <p className="text-red-600 text-xs mt-1 font-medium">
              {errors.exerciseRecent.message}
            </p>
          )}
        </div>

        {/* ===== Exercise Intensity ===== */}
        <div
          ref={setFieldRef("exerciseIntensity")}
          style={getFieldStyle("exerciseIntensity")}
          className="bg-gray-50 rounded-xl p-4 border border-gray-100"
        >
          <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
            {currentLanguage.exerciseIntensityLabel}
            <span className="text-red-500"> *</span>
          </Label>

          <select
            {...register("exerciseIntensity", validationRules.exerciseIntensity)}
            className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm
                       focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white"
          >
            <option value="">{currentLanguage.intensityOptions.empty}</option>
            <option value="light">{currentLanguage.intensityOptions.light}</option>
            <option value="moderate">{currentLanguage.intensityOptions.moderate}</option>
            <option value="vigorous">{currentLanguage.intensityOptions.vigorous}</option>
          </select>

          {errors.exerciseIntensity && (
            <p className="text-red-600 text-xs mt-1 font-medium">
              {errors.exerciseIntensity.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseSection;
