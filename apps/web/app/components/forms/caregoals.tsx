'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Label, Input } from '@repo/ui';
import axios from 'axios';

type HealthGoals = {
  selectedGoals: string[];
  customGoal: string;
};

const presetGoals = [
  'Reduce blood pressure',
  'Lower sugar levels',
  'Improve exercise',
  'Better diet',
  'Reduce medication',
];

const CareGoals = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<HealthGoals>({
    defaultValues: {
      selectedGoals: [],
      customGoal: '',
    },
  }); 
  

  const handleFormSubmit = async (data: HealthGoals) => {
    try {
      const allGoals = [...data.selectedGoals];
      if (data.customGoal.trim()) {
        allGoals.push(data.customGoal.trim());
      }

      await axios.post('http://localhost:3001/api/goals', {
        goals: allGoals,
      });

      alert('Care goals submitted!');
      reset();
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Failed to submit care goals');
    }
  };
  const selected = watch('selectedGoals');



  return (
    <div className="flex min-w-screen min-h-screen items-center justify-center">
      <div className="shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] w-1/2 rounded-md px-3 py-1 h-1/2">

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <h2 className="text-xl font-semibold text-center mb-4">Health Goals</h2>

          {/* Preset Goals */}
          <div className="mb-4">
            <Label>What are your goals? (Select all that apply)</Label>
            <div className="flex flex-col gap-2 mt-2">
              {presetGoals.map((goal) => (
                <Label key={goal}>
                  <Input
                    type="checkbox"
                    value={goal}
                    {...register('selectedGoals')}
                  />
                  {goal}
                </Label>
              ))}
            </div>
          </div>

          {/* Custom Goal */}
          <div>
            <Label htmlFor="customGoal">Other (Optional)</Label>
            <Input
              id="customGoal"
              placeholder="e.g., Reduce stress, improve sleep"
              {...register('customGoal')}
            />
          </div>

          <Button type="submit" className="mt-4">
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CareGoals;
