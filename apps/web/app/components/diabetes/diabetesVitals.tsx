"use client"
import React, { useState } from 'react';
import { Input, Label, Button } from '@repo/ui';
import { useForm } from "react-hook-form";
import { diabetesValidationRules } from '@repo/ui';
import { diabetesType } from '@/types/diabetes';
import { toast } from "react-hot-toast";
import CustomToaster from '../ui/CustomToaster';

const DiabetesVitals = () => {
  const { register, handleSubmit, formState, reset } = useForm<diabetesType>();
  const [isLoading, setIsLoading] = useState(false);
  const [requestAI, setRequestAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleFormSubmit = async (data: diabetesType) => {
    setIsLoading(true);
    setAiFeedback(null);

    // ✅ Ensure glucose is sent as a number
    const glucoseNumber = Number(data.glucose);

    try {
      const response = await fetch(`${API_URL}/api/diabetesVitals`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          glucose: glucoseNumber,  // 👈 FIXED HERE
          requestAI,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add glucose level");
      }

      if (result.aiFeedback) {
        toast.success("Data saved with AI feedback!");
        setAiFeedback(result.aiFeedback);
      } else if (result.aiError) {
        toast.success("Data saved, but AI feedback unavailable");
      } else {
        toast.success("Data saved successfully");
      }

      reset();
      setRequestAI(false);

    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <CustomToaster />
      <h2 className="text-xl font-semibold text-center mb-4 text-blue-600">
        Enter Glucose Data
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="glucose">Glucose Level</Label>
            <Input
              type="text"
              placeholder="Blood Glucose (mg/dl)"
              {...register("glucose", diabetesValidationRules.glucose)}
            />
            {formState.errors.glucose && (
              <p className="text-red-600">
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
              <p className="text-red-600">
                {formState.errors.context.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="language">Preferred Language</Label>
            <select 
              id="language" 
              className="w-full p-2 border border-gray-300 rounded-md"
              {...register("language")}
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>

          {/* AI Feedback Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requestAI"
              checked={requestAI}
              onChange={(e) => setRequestAI(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <Label htmlFor="requestAI" className="text-sm">
              🤖 Get AI health feedback about this reading
            </Label>
          </div>

          <Button type="submit" className="w-full">
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </form>

        {/* AI Feedback Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            🤖 AI Health Assistant
          </h3>

          {aiFeedback ? (
            <div className="bg-white p-3 rounded border-l-4 border-blue-500">
              <div className="whitespace-pre-wrap text-gray-800">
                {aiFeedback}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Check the box above to get AI feedback about your glucose reading.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiabetesVitals;
