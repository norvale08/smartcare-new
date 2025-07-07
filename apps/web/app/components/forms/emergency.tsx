"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { authValidationRules, Button, Input, Label, profileValidationRules } from '@repo/ui';
import axios from 'axios';

import { EmergencyTypes } from '@/types/profile';

const Emergency = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EmergencyTypes>();

  const handleFormSubmit = async (data: EmergencyTypes) => {
    try {
      await axios.post('http://localhost:3001/api/emergency', data);
      alert('Contact saved!');
      reset();
    } catch (error) {
      console.error(error);
      alert('Error saving contact');
    }
  };

  return (
    <div className="flex min-w-screen min-h-screen items-center justify-center">
      <div className="shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] w-1/2 rounded-md px-3 py-1 h-1/2">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <h1 className="text-center mb-4 font-bold text-xl">EMERGENCY CONTACT</h1>

          <div className="mb-4">
            <Label htmlFor="firstname">First Name</Label>
            <Input
              type="text"
              id="firstname"
              {...register('firstname',authValidationRules.firstName)}
            />
            {errors.firstname && (
              <p className="text-red-400">{errors.firstname.message}</p>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="lastname">Last Name</Label>
            <Input
              type="text"
              id="lastname"
              {...register('lastname', authValidationRules.lastName)}
            />
            {errors.lastname && (
              <p className="text-red-400">{errors.lastname.message}</p>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="phonenumber">Phone Number</Label>
            <Input
              type="text"
              id="phonenumber"
              {...register('phoneNumber', authValidationRules.phoneNumber)}
            />
            {errors.phoneNumber && (
              <p className="text-red-400">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="relationship">Relationship</Label>
            <select
              id="relationship"
              {...register('relationship', profileValidationRules.relationship)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
            >
              <option value="">Select relationship</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="spouse">Spouse</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
            {errors.relationship && (
              <p className="text-red-400">{errors.relationship.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full">Submit</Button>
        </form>
      </div>
    </div>
  );
};

export default Emergency;
