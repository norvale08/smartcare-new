"use client";
import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@repo/ui";
import BasicInfoStep from "./BasicInfo";
import EmergencyStep from "./emergency";
import MedicalHistoryStep from "./MedicalHistoryStep";
import ConditionsSelectionStep from "./ConditionSelection";
import ReviewStep from "./Review";
import { useRouter } from "next/navigation";

const steps = [
  { number: 1, title: "Basic Info" },
  { number: 2, title: "Emergency Contact" },
  { number: 3, title: "Condition Selection" },
  { number: 4, title: "Medical History" },
  { number: 5, title: "Review" },
];

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      fullName: "",
      dob: "",
      gender: "",
      weight: "",
      height: "",
      picture: null,
      firstname: "",
      lastname: "",
      phoneNumber: "",
      relationship: "",
      hypertension: false,
      diabetes: false,
      cardiovascular: false,
      surgeries: "",
      allergies: "",
      conditions: "",
    },
  });

  const { handleSubmit, getValues, setError, clearErrors, trigger } = methods;

  const onSubmit = async (data: any) => {
    try {
      // Get stored token
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3001/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Submission failed:", errorData);
        alert("Something went wrong. Please try again.");
        return;
      }

      const result = await res.json();
      console.log("✅ Success:", result);

      // Save new token from backend
      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      alert("Profile saved successfully!");
      router.push(result.redirectTo || "/dashboard");

    } catch (error) {
      console.error("❌ Error submitting form:", error);
      alert("Server error. Try again later.");
    }
  };

  const handleNext = async () => {
    if (step === 3) {
      const values = getValues();
      const hasAny =
        values.diabetes || values.hypertension || values.cardiovascular;

      if (!hasAny) {
        setError("conditions", {
          type: "manual",
          message: "Select at least one condition",
        });
        return;
      } else {
        clearErrors("conditions");
      }
    }

    const isStepValid = await trigger();
    if (isStepValid) {
      setStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="container max-w-4xl mx-auto">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white shadow-sm rounded-xl p-8 md:flex">
              {/* Sidebar Step Navigation */}
              <nav className="md:w-1/4 md:border-r md:pr-8 mb-8 md:mb-0">
                <ul role="list" className="space-y-6">
                  {steps.map((s) => (
                    <li key={s.number} className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-sm font-medium
                          ${
                            step >= s.number
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        {s.number}
                      </span>
                      <span
                        className={`text-sm ${
                          step >= s.number
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {s.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Step Content */}
              <div className="flex-1 md:pl-8">
                {step === 1 && <BasicInfoStep />}
                {step === 2 && <EmergencyStep />}
                {step === 3 && <ConditionsSelectionStep />}
                {step === 4 && <MedicalHistoryStep />}
                {step === 5 && <ReviewStep />}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {step > 1 && (
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      variant="outline"
                    >
                      Previous
                    </Button>
                  )}
                  {step < steps.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-blue-600 text-white py-2 px-4 rounded"
                    >
                      Next Step
                    </button>
                  ) : (
                    <Button type="submit" className="ml-auto">
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default MultiStepForm;
