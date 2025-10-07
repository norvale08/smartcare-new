"use client";
import React, { useState, useEffect } from "react";
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
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isExistingProfile, setIsExistingProfile] = useState(false);

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      userId: "",
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

  const { handleSubmit, getValues, setError, clearErrors, trigger, reset } = methods;

  // Check URL for step parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const stepNumber = parseInt(stepParam, 10);
      if (stepNumber >= 1 && stepNumber <= steps.length) {
        setStep(stepNumber);
      }
    } else {
      // No step parameter means base route, so start at step 1
      setStep(1);
    }
  }, []);

  // Prefill form with existing user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.data) {
            console.log("✅ Existing profile found:", data.data);
            setIsExistingProfile(true);
            // include userId in form values
            reset({ ...data.data, userId: data.data.userId });
          }
        } else {
          console.log("ℹ️ No existing profile found");
          setIsExistingProfile(false);
        }
      } catch (err) {
        console.error("❌ Error fetching profile:", err);
        setIsExistingProfile(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: any) => {
    try {
      console.log("=== PROFILE SUBMISSION DEBUG ===");
      console.log("Is existing profile:", isExistingProfile);
      console.log("Submitting data:", data);
      
      const token = localStorage.getItem("token");

      // Use POST for new profiles, PUT for updates
      const method = isExistingProfile ? "PUT" : "POST";
      console.log("Using HTTP method:", method);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (!res.ok) {
        console.error("❌ Submission failed:", result);
        alert("Something went wrong. Please try again.");
        return;
      }

      console.log("✅ Success:", result);
      console.log("📍 Redirect destination:", result.redirectTo);

      // Update token if provided
      if (result.token) {
        localStorage.setItem("token", result.token);
        console.log("🔑 Token updated");
      }

      alert("Profile updated successfully!");

      // CRITICAL: Use redirectTo from response, with proper fallback
      const redirectPath = result.redirectTo || "/profile";
      console.log("🚀 Redirecting to:", redirectPath);
      
      router.push(redirectPath);
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      alert("Server error. Try again later.");
    }
  };

  const handleNext = async () => {
    // Validate condition selection on step 3
    if (step === 3) {
      const values = getValues();
      if (!(values.diabetes || values.hypertension || values.cardiovascular)) {
        setError("conditions", { 
          type: "manual", 
          message: "Please select at least one health condition" 
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

  const handlePrevious = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleGoToStep = (targetStep: number) => {
    clearErrors(); // Clear any validation errors when navigating from review
    setStep(targetStep);
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="container max-w-4xl mx-auto">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white shadow-sm rounded-xl p-8 md:flex">
              {/* Sidebar */}
              <nav className="md:w-1/4 md:border-r md:pr-8 mb-8 md:mb-0">
                <ul role="list" className="space-y-6">
                  {steps.map((s) => (
                    <li key={s.number} className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-sm font-medium ${
                          step >= s.number ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {s.number}
                      </span>
                      <span className={step >= s.number ? "text-gray-900" : "text-gray-400"}>
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
                {step === 5 && <ReviewStep goToStep={handleGoToStep} />}

                {/* Navigation */}
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
                      className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                      Next Step
                    </button>
                  ) : (
                    <Button type="submit" className="ml-auto">
                      {isExistingProfile ? "Update Profile" : "Complete Profile"}
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