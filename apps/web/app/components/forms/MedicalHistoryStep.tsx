"use client";
import React from "react";
import { useFormContext } from "react-hook-form";
import { Input, Label, profileValidationRules } from "@repo/ui";

const MedicalHistoryStep = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step 5: Medical History</h2>
      <p className="text-sm text-gray-600">
        Provide any additional medical background that may help us better tailor your care.
      </p>

      {/* Surgeries */}
      <div>
        <Label htmlFor="surgeries">Surgeries (Optional)</Label>
        <textarea
          id="surgeries"
          {...register("surgeries", profileValidationRules.surgeries)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="List any past surgeries (e.g., C-section in 2021)"
          rows={4}
        />
        {errors.surgeries?.message && (
          <p className="mt-1 text-sm text-red-500">
            {errors.surgeries.message as string}
          </p>
        )}
      </div>

      {/* Allergies */}
      <div>
        <Label htmlFor="allergies">Allergies (Optional)</Label>
        <textarea
          id="allergies"
          {...register("allergies", profileValidationRules.allergies)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="List any allergies (e.g., Penicillin, peanuts)"
          rows={4}
        />
        {errors.allergies?.message && (
          <p className="mt-1 text-sm text-red-500">
            {errors.allergies.message as string}
          </p>
        )}
      </div>
    </div>
  );
};

export default MedicalHistoryStep;
