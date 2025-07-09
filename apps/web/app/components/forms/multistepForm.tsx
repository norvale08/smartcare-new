"use client";
import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@repo/ui";
import BasicInfoStep from "./BasicInfo";
import EmergencyStep from "./emergency";
import MedicalHistoryStep from "./MedicalHistoryStep";
import ConditionsSelectionStep from "./ConditionSelection";
import ReviewStep from "./Review";

const steps = [
  { number: 1, title: "Basic Info" },
  { number: 2, title: "Emergency Contact" },
  { number: 3, title: "Condition Selection" },
  { number: 4, title: "Medical History" },
  { number: 5, title: "Review" },
];

const MultiStepForm = () => {
  const [step, setStep] = useState(1);

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

  const onSubmit =async (data: any) => {
    try {
    const res = await fetch("http://localhost:3001/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    console.log("Success:", result);
    alert("Profile saved successfully!");
  
  } catch (error) {
    console.error("Error submitting form:", error);
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
      <div className="container max-w-3xl mx-auto overflow-hidden">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="p-8 bg-white shadow-sm rounded-xl">
              
              <div className="flex items-center mb-12 space-x-4">
                {steps.map((s, index) => (
                  <div key={s.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          step >= s.number
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {s.number}
                      </div>
                      <span
                        className={`text-sm text-center ${
                          step >= s.number
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-[1px] bg-gray-200 mx-4" />
                    )}
                  </div>
                ))}
              </div>

              
              {step === 1 && <BasicInfoStep />}
              {step === 2 && <EmergencyStep />}
              {step === 3 && <ConditionsSelectionStep />}
              {step === 4 && <MedicalHistoryStep />}
              {step === 5 && <ReviewStep />}

              
              <div className="flex justify-between mt-8">
                {step > 1 && (
                  <Button type="button" onClick={handlePrevious} variant="outline">
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
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default MultiStepForm;
