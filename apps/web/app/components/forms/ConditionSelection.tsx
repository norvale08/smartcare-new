"use client";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@repo/ui";

const ConditionsSelectionStep = () => {
  const {
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const diabetes = watch("diabetes");
  const hypertension = watch("hypertension");
  const cardiovascular = watch("cardiovascular");

  useEffect(() => {
    const anySelected = diabetes || hypertension || cardiovascular;

    if (!anySelected) {
      setError("conditions", {
        type: "manual",
        message: "Select at least one condition",
      });
    } else {
      clearErrors("conditions");
    }
  }, [diabetes, hypertension, cardiovascular, setError, clearErrors]);

  const conditions = [
    { id: "diabetes", label: "Diabetes" },
    { id: "hypertension", label: "Hypertension" },
    { id: "cardiovascular", label: "Cardiovascular Disease" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step 3: Conditions You're Managing</h2>
      <p className="text-sm text-gray-600">
        Select the condition(s) you’re currently managing. This helps us customize your dashboard and care plan.
      </p>

      <div>
        <Label className="block mb-3 text-base font-medium text-gray-700">
          Select all that apply:
        </Label>
        <div className="space-y-3">
          {conditions.map((condition) => (
            <label
              key={condition.id}
              htmlFor={condition.id}
              className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer"
            >
              <input
                type="checkbox"
                id={condition.id}
                {...register(condition.id)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              {condition.label}
            </label>
          ))}
        </div>
      </div>

      {/* Hidden input to allow setting custom 'conditions' error */}
      <input type="hidden" {...register("conditions")} />

      {errors.conditions && (
        <p className="text-red-500 text-sm mt-2">{errors.conditions.message as string}</p>
      )}
    </div>
  );
};

export default ConditionsSelectionStep;
