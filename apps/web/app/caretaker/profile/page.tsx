"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Label, Button } from "@repo/ui";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import CustomToaster from "@/app/components/ui/CustomToaster";

interface DoctorProfileData {
  bio: string;
  experienceYears: string;
  consultationHours: string;
  services: string;
  location: string;
  profilePicture?: string;
}

const DoctorProfile = () => {
  const { register, handleSubmit, formState, reset } = useForm<DoctorProfileData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ensure the user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      router.replace("/login");
    }
  }, [router]);

  const onSubmit = async (data: DoctorProfileData) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Doctor authentication token not found");
      return;
    }

    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${API_URL}/api/doctors/profile/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Send token to backend
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Failed to complete profile");
        return;
      }

      toast.success("🎉 Profile completed successfully!");
      localStorage.setItem("profileCompleted", "true");

      // Redirect to doctor dashboard
      setTimeout(() => router.replace("/caretaker"), 1500);
      reset();
    } catch (err) {
      console.error("Profile completion error:", err);
      toast.error("Error completing profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <CustomToaster />
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-4">
          Complete Your Profile
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Please provide your professional details before accessing your dashboard.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Bio</Label>
            <Input
              placeholder="Brief professional bio"
              {...register("bio", { required: "Bio is required" })}
            />
            {formState.errors.bio && (
              <p className="text-red-500 text-sm">{formState.errors.bio.message}</p>
            )}
          </div>

          <div>
            <Label>Experience (Years)</Label>
            <Input
              type="number"
              placeholder="e.g. 5"
              {...register("experienceYears", { required: "Experience is required" })}
            />
          </div>

          <div>
            <Label>Consultation Hours</Label>
            <Input
              placeholder="e.g. Mon-Fri, 9am - 4pm"
              {...register("consultationHours", {
                required: "Consultation hours are required",
              })}
            />
          </div>

          <div>
            <Label>Services Offered</Label>
            <Input
              placeholder="e.g. Diabetes management, Hypertension care"
              {...register("services", { required: "Services are required" })}
            />
          </div>

          <div>
            <Label>Location</Label>
            <Input
              placeholder="e.g. Nairobi Hospital"
              {...register("location", { required: "Location is required" })}
            />
          </div>

          <div>
            <Label>Profile Picture (URL)</Label>
            <Input
              placeholder="e.g. https://example.com/image.jpg"
              {...register("profilePicture")}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-400 hover:bg-blue-900 disabled:bg-gray-300"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfile;
