// apps/web/app/components/diabetesPages/components/CardiovascularSection.tsx
import React from 'react';
import { Input, Label } from "@repo/ui";
import { Heart, Clock, AlertCircle } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { diabetesType } from "@/types/diabetes";

interface CardiovascularSectionProps {
  register: UseFormRegister<diabetesType>;
  errors: FieldErrors<diabetesType>;
  currentLanguage: any;
  validationRules: any;
  setFieldRef: (fieldName: string) => (el: HTMLDivElement | null) => void;
  getFieldStyle: (fieldName: string) => React.CSSProperties;
  hasHypertension?: boolean;
  hasBothConditions?: boolean;
}

const CardiovascularSection: React.FC<CardiovascularSectionProps> = ({
  register,
  errors,
  currentLanguage,
  validationRules,
  setFieldRef,
  getFieldStyle,
  hasHypertension = false,
  hasBothConditions = false,
}) => {
  const isBPRequired = hasHypertension || hasBothConditions;

  // Log for debugging
  React.useEffect(() => {
    console.log("🩺 CardiovascularSection Props:", {
      hasHypertension,
      hasBothConditions,
      isBPRequired
    });
  }, [hasHypertension, hasBothConditions, isBPRequired]);

  const systolicValidation = React.useMemo(() => {
    const baseRules = { ...validationRules.systolic };
    
    if (isBPRequired) {
      return {
        ...baseRules,
        required: currentLanguage.systolicRequired || "Systolic blood pressure is required",
        validate: {
          ...baseRules.validate,
          notEmpty: (value: any) => {
            if (!value || value === '' || value === null || value === undefined) {
              return currentLanguage.systolicRequired || "Systolic blood pressure is required";
            }
            return true;
          },
          range: (value: any) => {
            const num = Number(value);
            if (isNaN(num)) return "Please enter a valid number";
            if (num < 70 || num > 250) {
              return "Systolic pressure must be between 70 and 250";
            }
            return true;
          }
        }
      };
    }
    
    return {
      ...baseRules,
      required: false,
      validate: {
        range: (value: any) => {
          if (!value || value === '') return true;
          const num = Number(value);
          if (isNaN(num)) return "Please enter a valid number";
          if (num < 70 || num > 250) {
            return "Systolic pressure must be between 70 and 250";
          }
          return true;
        }
      }
    };
  }, [isBPRequired, validationRules.systolic, currentLanguage.systolicRequired]);

  const diastolicValidation = React.useMemo(() => {
    const baseRules = { ...validationRules.diastolic };
    
    if (isBPRequired) {
      return {
        ...baseRules,
        required: currentLanguage.diastolicRequired || "Diastolic blood pressure is required",
        validate: {
          ...baseRules.validate,
          notEmpty: (value: any) => {
            if (!value || value === '' || value === null || value === undefined) {
              return currentLanguage.diastolicRequired || "Diastolic blood pressure is required";
            }
            return true;
          },
          range: (value: any) => {
            const num = Number(value);
            if (isNaN(num)) return "Please enter a valid number";
            if (num < 40 || num > 150) {
              return "Diastolic pressure must be between 40 and 150";
            }
            return true;
          }
        }
      };
    }
    
    return {
      ...baseRules,
      required: false,
      validate: {
        range: (value: any) => {
          if (!value || value === '') return true;
          const num = Number(value);
          if (isNaN(num)) return "Please enter a valid number";
          if (num < 40 || num > 150) {
            return "Diastolic pressure must be between 40 and 150";
          }
          return true;
        }
      }
    };
  }, [isBPRequired, validationRules.diastolic, currentLanguage.diastolicRequired]);

  return (
    <div
      ref={setFieldRef('systolic')}
      style={getFieldStyle('systolic')}
      className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 ${
          isBPRequired 
            ? 'bg-gradient-to-br from-red-600 to-pink-600' 
            : 'bg-gradient-to-br from-red-500 to-pink-500'
        } rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
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

      {/* Conditional Alert - Different messaging based on condition combination */}
      {isBPRequired && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-red-900 mb-1">
                {hasBothConditions 
                  ? (currentLanguage.bpRequiredDual || "Blood Pressure Monitoring Required - Dual Condition Management")
                  : (currentLanguage.bpRequired || "Blood Pressure Monitoring Required")}
              </h3>
              <p className="text-xs sm:text-sm text-red-700">
                {hasBothConditions
                  ? (currentLanguage.bpRequiredMessageDual || "As you manage both diabetes and hypertension, blood pressure readings are essential for comprehensive cardiovascular monitoring and preventing complications.")
                  : (currentLanguage.bpRequiredMessage || "As you manage hypertension, blood pressure readings are required to monitor your cardiovascular health.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content wrapper */}
      <div className={`${
        isBPRequired 
          ? 'bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-200' 
          : 'bg-gradient-to-r from-red-50 to-pink-50'
      } rounded-xl p-3 sm:p-4 md:p-5 mb-3 sm:mb-4`}>
        {/* Pro tip - Enhanced for dual conditions */}
        <div className="flex items-start gap-2 mb-3 sm:mb-4">
          <Clock className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
          <p className="text-xs sm:text-sm text-gray-700 flex-1">
            {hasBothConditions
              ? (currentLanguage.proTipDual || "For comprehensive diabetes and hypertension management, measure your blood pressure at the same time each day, ideally before taking any medications.")
              : isBPRequired 
                ? (currentLanguage.proTipRequired || "Measure your blood pressure at the same time each day for accurate tracking.")
                : currentLanguage.proTip}
          </p>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Systolic */}
          <div>
            <Label 
              htmlFor="systolic" 
              className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2"
            >
              {currentLanguage.systolicLabel}
              {isBPRequired ? (
                <span className="text-red-600 ml-1 text-base font-bold">*</span>
              ) : (
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              )}
            </Label>
            <Input
              type="number"
              id="systolic"
              placeholder={currentLanguage.systolicPlaceholder}
              aria-required={isBPRequired}
              aria-invalid={!!errors.systolic}
              className={`w-full border-2 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all ${
                isBPRequired
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white'
                  : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              } ${errors.systolic ? 'border-red-500 bg-red-50' : ''}`}
              {...register("systolic", systolicValidation)}
            />
            {errors.systolic && (
              <p className="text-red-600 text-xs mt-1 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={12} />
                {errors.systolic.message}
              </p>
            )}
          </div>

          {/* Diastolic */}
          <div>
            <Label 
              htmlFor="diastolic" 
              className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2"
            >
              {currentLanguage.diastolicLabel}
              {isBPRequired ? (
                <span className="text-red-600 ml-1 text-base font-bold">*</span>
              ) : (
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              )}
            </Label>
            <Input
              type="number"
              id="diastolic"
              placeholder={currentLanguage.diastolicPlaceholder}
              aria-required={isBPRequired}
              aria-invalid={!!errors.diastolic}
              className={`w-full border-2 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all ${
                isBPRequired
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white'
                  : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              } ${errors.diastolic ? 'border-red-500 bg-red-50' : ''}`}
              {...register("diastolic", diastolicValidation)}
            />
            {errors.diastolic && (
              <p className="text-red-600 text-xs mt-1 font-medium flex items-center gap-1 animate-in fade-in-from-top-1 duration-200">
                <AlertCircle size={12} />
                {errors.diastolic.message}
              </p>
            )}
          </div>

          {/* Heart Rate */}
          <div>
            <Label 
              htmlFor="heartRate" 
              className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2"
            >
              {currentLanguage.heartRateLabel} 
              <span className="text-gray-400 text-xs ml-1">(Optional)</span>
            </Label>
            <Input
              type="number"
              id="heartRate"
              placeholder={currentLanguage.heartRatePlaceholder}
              className={`w-full border-2 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all ${
                isBPRequired
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              } ${errors.heartRate ? 'border-red-500 bg-red-50' : ''}`}
              {...register("heartRate", validationRules.heartRate)}
            />
            {errors.heartRate && (
              <p className="text-red-600 text-xs mt-1 font-medium flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.heartRate.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Info - Enhanced for dual conditions */}
      {isBPRequired && (
        <div className="mt-3 text-xs sm:text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
          <p className="font-medium text-blue-900 mb-1">
            💡 {hasBothConditions 
              ? (currentLanguage.bpTipsTitleDual || "Blood Pressure Monitoring Tips for Diabetes & Hypertension:")
              : (currentLanguage.bpTipsTitle || "Blood Pressure Monitoring Tips:")}
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>{currentLanguage.bpTip1 || "Rest for 5 minutes before measuring"}</li>
            <li>{currentLanguage.bpTip2 || "Sit with back supported and feet flat on the floor"}</li>
            <li>{currentLanguage.bpTip3 || "Avoid caffeine 30 minutes before measuring"}</li>
            {hasBothConditions && (
              <li className="font-semibold text-blue-900">
                {currentLanguage.bpTip4Dual || "Monitor both blood sugar and blood pressure regularly - they affect each other"}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Additional warning for dual conditions */}
      {hasBothConditions && (
        <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs sm:text-sm text-amber-900">
              <span className="font-semibold">Important:</span> {currentLanguage.dualConditionWarning || "Managing both diabetes and hypertension requires careful monitoring. High blood pressure can worsen diabetes complications, and vice versa. Regular readings help prevent serious cardiovascular events."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardiovascularSection;