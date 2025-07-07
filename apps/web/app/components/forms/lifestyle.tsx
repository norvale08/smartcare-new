'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Label, Input } from '@repo/ui';
import axios from 'axios';

type LifestyleFormValues = {
    smokes: 'yes' | 'no';
    drinksAlcohol: 'yes' | 'no';
    exerciseFrequency: 'never' | 'occasionally' | 'weekly' | 'daily';
};

const LifestyleForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<LifestyleFormValues>({
        defaultValues: {
            smokes: 'no',
            drinksAlcohol: 'no',
            exerciseFrequency: 'never',
        },
    });

   const handleFormSubmit = async (data: LifestyleFormValues) => {
    try {
      await axios.post('http://localhost:3001/api/lifestyle', data);
      alert('Contact saved!');
      reset();
    } catch (error) {
      console.error(error);
      alert('Error saving contact');
    }
  };


    return (
        <div>
            <h2 className="text-2xl">Lifestyle Habits</h2>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">

                {/* Smokes */}
                <div>
                    <Label>Do you smoke?</Label>
                    <div className="flex gap-4 mt-2">
                        <Label>
                            <Input
                                type="radio"
                                value="yes"
                                {...register('smokes', {
                                    required: 'Please select an option',
                                })}
                            />
                            Yes
                        </Label>
                        <Label>
                            <Input
                                type="radio"
                                value="no"
                                {...register('smokes', {
                                    required: 'Please select an option',
                                })}
                            />
                            No
                        </Label>
                    </div>
                    {errors.smokes && (
                        <p className="text-red-400">{errors.smokes.message}</p>
                    )}
                </div>

                {/* Drinks Alcohol */}
                <div>
                    <Label>Do you drink alcohol?</Label>
                    <div className="flex gap-4 mt-2">
                        <Label>
                            <Input
                                type="radio"
                                value="yes"
                                {...register('drinksAlcohol', {
                                    required: 'Please select an option',
                                })}
                            />
                            Yes
                        </Label>
                        <Label>
                            <Input
                                type="radio"
                                value="no"
                                {...register('drinksAlcohol', {
                                    required: 'Please select an option',
                                })}
                            />
                            No
                        </Label>
                    </div>
                    {errors.drinksAlcohol && (
                        <p className="text-red-400">{errors.drinksAlcohol.message}</p>
                    )}
                </div>

                {/* Exercise Frequency */}
                <div>
                    <Label htmlFor="exerciseFrequency">
                        How often do you exercise?
                    </Label>
                    <select id="exerciseFrequency" {...register('exerciseFrequency')}>
                        <option value="never">Never</option>
                        <option value="occasionally">Occasionally</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                    </select>
                </div>

                <Button type="submit" className="mt-4">
                    Submit
                </Button>
            </form>
        </div>
    );
};

export default LifestyleForm;
