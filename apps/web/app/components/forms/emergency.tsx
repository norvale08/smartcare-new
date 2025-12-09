"use client";
import React from 'react';
import { useFormContext } from "react-hook-form";
import { Input, Label } from '@repo/ui';
import { authValidationRules, profileValidationRules } from "@repo/ui";

const EmergencyStep = () => {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Step 2: Emergency Contact</h2>

      <div>
        <Label htmlFor="firstname">First Name</Label>
        <Input
          type="text"
          id="firstname"
          {...register('firstname', authValidationRules.firstName)}
        />
        {errors.firstname?.message && (
          <p className="text-red-500">{errors.firstname.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="lastname">Last Name</Label>
        <Input
          type="text"
          id="lastname"
          {...register('lastname', authValidationRules.lastName)}
        />
        {errors.lastname?.message && (
          <p className="text-red-500">{errors.lastname.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          id="email"
          {...register('email', authValidationRules.email)}
        />
        {errors.email?.message && (
          <p className="text-red-500">{errors.email.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          type="text"
          id="phoneNumber"
          {...register('phoneNumber', authValidationRules.phoneNumber)}
        />
        {errors.phoneNumber?.message && (
          <p className="text-red-500">{errors.phoneNumber.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="relationship">Relationship</Label>
        <select
          id="relationship"
          {...register('relationship', profileValidationRules.relationship)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select relationship</option>
          <option value="parent">Parent</option>
          <option value="sibling">Sibling</option>
          <option value="spouse">Spouse</option>
          <option value="friend">Friend</option>
          <option value="other">Other</option>
        </select>
        {errors.relationship?.message && (
          <p className="text-red-500">{errors.relationship.message as string}</p>
        )}
      </div>
    </div>
  );
};

export default EmergencyStep;