// apps/web/app/components/diabetesPages/components/GlucoseContextSection.tsx

import React from "react";
import { Input, Label } from "@repo/ui";
import { Droplet, Clock } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface GlucoseContextSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  fieldStyle: React.CSSProperties;
}

const GlucoseContextSection: React.FC<GlucoseContextSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  fieldStyle
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ================= GLUCOSE INPUT ================= */}
      <div
        ref={setFieldRef("glucose")}
        style={fieldStyle}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all pointer-events-auto"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Droplet className="text-white w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-blue-900">
            {currentLanguage.glucoseLabel || "Blood Glucose"}
          </h3>
        </div>

        <Label
          htmlFor="glucose"
          className="text-xs font-medium text-gray-700 mb-1.5 block"
        >
          {currentLanguage.glucoseLabel || "Glucose Level"} (mg/dL)
          <span className="text-red-500"> *</span>
        </Label>

        <Input
          type="number"
          id="glucose"
          placeholder={currentLanguage.glucosePlaceholder || "Enter glucose"}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20
                     transition-all"
          {...register("glucose", validationRules.glucose)}
        />

        {errors.glucose && (
          <p className="text-red-600 text-xs mt-1.5 font-medium">
            {errors.glucose.message}
          </p>
        )}
      </div>

      {/* ================= CONTEXT DROPDOWN ================= */}
      <div
        ref={setFieldRef("context")}
        style={fieldStyle}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all pointer-events-auto"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Clock className="text-white w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-emerald-900">
            {currentLanguage.contextLabel || "Measurement Context"}
          </h3>
        </div>

        <Label
          htmlFor="context"
          className="text-xs font-medium text-gray-700 mb-1.5 block"
        >
          {currentLanguage.contextLabel || "Context"}
          <span className="text-red-500"> *</span>
        </Label>

        <select
          id="context"
          {...register("context", validationRules.context)}
          className="
            w-full appearance-none border-2 border-gray-200 rounded-lg
            px-3 py-2 text-sm bg-white cursor-pointer
            focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20
            transition-all
          "
        >
          <option value="">
            {currentLanguage.contextOptions?.empty || "Select context"}
          </option>
          <option value="Fasting">
            {currentLanguage.contextOptions?.fasting || "Fasting"}
          </option>
          <option value="Post-meal">
            {currentLanguage.contextOptions?.postMeal || "Post-meal"}
          </option>
          <option value="Random">
            {currentLanguage.contextOptions?.random || "Random"}
          </option>
        </select>

        {errors.context && (
          <p className="text-red-600 text-xs mt-1.5 font-medium">
            {errors.context.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default GlucoseContextSection;
