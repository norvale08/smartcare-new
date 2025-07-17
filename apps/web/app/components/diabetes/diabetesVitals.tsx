"use client"
import React, { useState } from 'react';
import { Input, Label, Button } from '@repo/ui';
import { useForm } from "react-hook-form";
import { diabetesValidationRules } from '@repo/ui';
import { diabetesType } from '@/types/diabetes';

const DiabetesVitals = () => {
  const { register, handleSubmit, formState, reset } = useForm<diabetesType>();
  const [isLoading, setLoading] = useState(false);

  const handleFormSubmit = () => {
    reset();
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold text-center mb-4 text-blue-600">Enter Glucose Data</h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="glucose">Glucose Level</Label>
          <Input
            type="text"
            placeholder="Blood Glucose (mg/dl)"
            {...register("glucose", diabetesValidationRules.glucose)}
          />
          {formState.errors.glucose && (
            <p className=" text-red-600 ">
              {formState.errors.glucose.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="context">Context</Label>
          <select
            id="context"
            className="w-full p-2 border border-gray-300 rounded-md"
            {...register("context", diabetesValidationRules.context)}
          >
            <option value="">Select context</option>
            <option value="Fasting">Fasting</option>
            <option value="Post-meal">Post Meal</option>
            <option value="Random">Random</option>
          </select>
          {formState.errors.context && (
            <p className=" text-red-600 ">
              {formState.errors.context.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full">
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default DiabetesVitals;
