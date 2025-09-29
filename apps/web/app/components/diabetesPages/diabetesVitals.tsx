"use client";
import React, { useState } from "react";
import { Input, Label, Button } from "@repo/ui";
import { useForm } from "react-hook-form";
import { diabetesValidationRules } from "@repo/ui";
import { diabetesType } from "@/types/diabetes";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import VoiceInput from "../ui/VoiceInput";
import { wordsToNumbers } from "words-to-numbers";
import { swahiliToNumber } from "../utils/swahiliParser";

interface Props {
  onVitalsSubmitted?: (id: string, requestAI: boolean) => void;
}

function normalizeNumber(text: string): number | null {
  text = text.toLowerCase().trim();
  if (!isNaN(Number(text))) return Number(text);
  const eng = wordsToNumbers(text);
  if (typeof eng === "number" && !isNaN(eng)) return eng;
  const swa = swahiliToNumber(text);
  if (swa !== null) return swa;
  return null;
}

const DiabetesVitalsForm: React.FC<Props> = ({ onVitalsSubmitted }) => {
  const { register, handleSubmit, formState, reset, setValue } =
    useForm<diabetesType>();
  const [isLoading, setIsLoading] = useState(false);
  const [requestAI, setRequestAI] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleFormSubmit = async (data: diabetesType) => {
    setIsLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/diabetesVitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          glucose: Number(data.glucose),
          requestAI,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to add glucose");

      toast.success("Data saved successfully");
      reset();
      setRequestAI(false);

      // Notify parent
      if (onVitalsSubmitted) onVitalsSubmitted(result.id, requestAI);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <CustomToaster />
      <h2 className="text-xl font-semibold text-center mb-4 text-blue-600">
        Enter Glucose Data
      </h2>

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
          <div className="mt-2">
            <VoiceInput
              lang="sw-KE"
              placeholder="Say your glucose value..."
              onResult={(text) => {
                const num = normalizeNumber(text);
                if (num !== null) setValue("glucose", num);
                else toast.error("Invalid number");
              }}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="context">Context</Label>
          <select
            {...register("context", diabetesValidationRules.context)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select context</option>
            <option value="Fasting">Fasting</option>
            <option value="Post-meal">Post Meal</option>
            <option value="Random">Random</option>
          </select>
          {formState.errors.context && (
            <p className="text-red-600">{formState.errors.context.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="language">Preferred Language</Label>
          <select
            {...register("language")}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requestAI"
            checked={requestAI}
            onChange={(e) => setRequestAI(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <Label htmlFor="requestAI" className="text-sm">
            🤖 Get AI health feedback
          </Label>
        </div>

        <Button type="submit" className="w-full">
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default DiabetesVitalsForm;
