'use client';
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button, Input, Label } from '@repo/ui';
import axios from 'axios';

type Medication = {
    medicationName: string;
    dosage: string;
    frequency: string;
};

type FormValues = {
    name: string;
    age: number;
    takesMedication: string;
    medications: Medication[];
};

const CurrentMedications = () => {
    const {
        register,
        handleSubmit,
        formState,
        reset,
        watch,
        control,
    } = useForm<FormValues>({
        defaultValues: {
            medications: [],
        },
    });

    const takesMedication = watch('takesMedication');

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'medications',
    });

    const handleFormSubmit = async (data: FormValues) => {
        try {
            await axios.post('http://localhost:3001/api/medications', data);
            alert('Current medications submitted!');
            reset();
        } catch (error) {
            console.error('Error saving current medications data:', error);
            alert('Failed to submit current medications');
        }
    };

    return (
        <div>
            <h2 className="text-2xl">Current Medications</h2>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Label>Do you currently take medication?</Label>
                <div className="flex gap-4">
                    <Label>
                        <Input
                            type="radio"
                            value="yes"
                            {...register('takesMedication', {
                                required: 'This field is required',
                            })}
                        />
                        Yes
                    </Label>
                    <Label>
                        <Input
                            type="radio"
                            value="no"
                            {...register('takesMedication', {
                                required: 'This field is required',
                            })}
                        />
                        No
                    </Label>
                </div>
                {formState.errors.takesMedication && (
                    <p className="text-red-400">
                        {formState.errors.takesMedication.message}
                    </p>
                )}

                {/* Conditional Medication Fields */}
                {takesMedication === 'yes' && (
                    <>
                        <p className="font-medium mt-4">Medications</p>
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="border p-3 rounded space-y-2 relative"
                            >
                                <Button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute top-1 right-2 text-sm text-red-500 hover:underline"
                                >
                                    Remove
                                </Button>

                                <div>
                                    <Label
                                        htmlFor={`medications.${index}.medicationName`}
                                    >
                                        Medication Name:
                                    </Label>
                                    <Input
                                        type="text"
                                        id={`medications.${index}.medicationName`}
                                        {...register(
                                            `medications.${index}.medicationName`,
                                            {
                                                required:
                                                    'Medication name is required',
                                                pattern: {
                                                    value: /^[A-Za-z\s]+$/,
                                                    message:
                                                        'Medication Name should contain only letters',
                                                },
                                            }
                                        )}
                                    />
                                    {formState.errors.medications?.[index]
                                        ?.medicationName && (
                                            <p className="text-red-400">
                                                {
                                                    formState.errors.medications[
                                                        index
                                                    ]?.medicationName?.message
                                                }
                                            </p>
                                        )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor={`medications.${index}.dosage`}
                                    >
                                        Dosage (e.g., 500mg):
                                    </Label>
                                    <Input
                                        type="text"
                                        id={`medications.${index}.dosage`}
                                        {...register(
                                            `medications.${index}.dosage`,
                                            {
                                                required: 'Dosage is required',
                                                pattern: {
                                                    value: /^\d+\s?(mg|ml|g|mcg|tablet[s]?|capsule[s]?|pill[s]?)$/i,
                                                    message:
                                                        'Dosage must be a number followed by a unit (e.g., 1 tablet, 500mg)',
                                                },
                                            }
                                        )}
                                    />
                                    {formState.errors.medications?.[index]
                                        ?.dosage && (
                                            <p className="text-red-400">
                                                {
                                                    formState.errors.medications[
                                                        index
                                                    ]?.dosage?.message
                                                }
                                            </p>
                                        )}
                                </div>

                                <div>
                                    <Label
                                        htmlFor={`medications.${index}.frequency`}
                                    >
                                        Frequency (e.g., twice a day):
                                    </Label>
                                    <Input
                                        type="text"
                                        id={`medications.${index}.frequency`}
                                        {...register(
                                            `medications.${index}.frequency`,
                                            {
                                                required:
                                                    'Frequency is required',
                                                pattern: {
                                                    value: /^[\w\s]+$/i,
                                                    message:
                                                        'Frequency should only include words and numbers',
                                                },
                                            }
                                        )}
                                    />
                                    {formState.errors.medications?.[index]
                                        ?.frequency && (
                                            <p className="text-red-400">
                                                {
                                                    formState.errors.medications[
                                                        index
                                                    ]?.frequency?.message
                                                }
                                            </p>
                                        )}
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            onClick={() =>
                                append({
                                    medicationName: '',
                                    dosage: '',
                                    frequency: '',
                                })
                            }
                            className="bg-gray-400 text-sm px-4 py-2 rounded hover:bg-gray-300 mt-4"
                        >
                            Add Another
                        </Button>
                    </>
                )}

                <Button type="submit" className="mt-6">
                    Submit
                </Button>
            </form>
        </div>
    );
};

export default CurrentMedications;
