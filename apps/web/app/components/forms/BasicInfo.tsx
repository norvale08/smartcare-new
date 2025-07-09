"use client";
import React from 'react';
import { useFormContext } from "react-hook-form";
import { Input, Label } from '@repo/ui';
import { profileValidationRules } from "@repo/ui";

const BasicInfoStep = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step 1: Basic Information</h2>

      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          type="text"
          placeholder="Full Name"
          {...register("fullName", profileValidationRules.fullName)}
        />
        {errors.fullName?.message && (
          <p className="text-red-500">{errors.fullName.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="dob">Date of Birth</Label>
        <Input
          type="date"
          {...register("dob", profileValidationRules.dob)}
        />
        {errors.dob?.message && (
          <p className="text-red-500">{errors.dob.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          {...register("gender", profileValidationRules.gender)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select your gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
        {errors.gender?.message && (
          <p className="text-red-500">{errors.gender.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="weight">Weight</Label>
        <Input
          type="number"
          {...register("weight", profileValidationRules.weight)}
        />
        {errors.weight?.message && (
          <p className="text-red-500">{errors.weight.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="height">Height</Label>
        <Input
          type="number"
          {...register("height", profileValidationRules.height)}
        />
        {errors.height?.message && (
          <p className="text-red-500">{errors.height.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="picture">Upload your picture</Label>
        <input
          id="picture"
          type="file"
          accept="image/*"
          {...register("picture")}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {errors.picture?.message && (
          <p className="text-red-500">{errors.picture.message as string}</p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoStep;
