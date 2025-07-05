"use client";
import { Input, Button, Label } from '@repo/ui';
import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

type Medical = {
  hypertension: boolean;
  diabetes: boolean;
  asthma: boolean;
  stroke: boolean;
  surgeries?: string;
  allergies?: string;
};

const Medicalhistory = () => {
  const {
    register,
    handleSubmit,
    reset,
  } = useForm<Medical>();

  const handleFormSubmit = async (data: Medical) => {
  try {
    await axios.post('http://localhost:3001/api/medical', data);
    alert('Medical history submitted!');
    reset();
  } catch (error) {
    console.error('Error saving medical history:', error);
    alert('Failed to submit medical history');
  }
};

  return (
    <div className="flex min-w-screen min-h-screen items-center justify-center bg-gray-100">
      <div className="shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] w-1/2 rounded-md px-6 py-4 bg-white">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <h1 className="text-xl font-semibold text-center mb-4">Medical History</h1>

          <div className="mb-4">
            <Label className="block mb-2">Previous Conditions</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2">
                <Input type="checkbox" {...register("hypertension")} id="hypertension" />
                <span>Hypertension</span>
              </label>

              <label className="flex items-center space-x-2">
                <Input type="checkbox" {...register("diabetes")} id="diabetes" />
                <span>Diabetes</span>
              </label>

              <label className="flex items-center space-x-2">
                <Input type="checkbox" {...register("stroke")} id="stroke" />
                <span>Stroke</span>
              </label>

              <label className="flex items-center space-x-2">
                <Input type="checkbox" {...register("asthma")} id="asthma" />
                <span>Asthma</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="surgeries" className="block mb-1">Surgeries (Optional)</Label>
            <textarea
              id="surgeries"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe any surgeries"
              {...register("surgeries")}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="allergies" className="block mb-1">Allergies (Optional)</Label>
            <textarea
              id="allergies"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="List any allergies"
              {...register("allergies")}
            />
          </div>

          <Button type="submit" >Submit</Button>
        </form>
      </div>
    </div>
  );
};

export default Medicalhistory;
