'use client';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Label, Input } from '@repo/ui';
import axios from 'axios';

type ConditionType = 'Diabetes' | 'Hypertension' | 'Cardiovascular' | 'Respiratory' | 'Kidney';

type DiseaseFormValues = {
    primaryCondition: ConditionType;
    secondaryConditions: ConditionType[];
    severity: {
        [key in ConditionType]?: {
            [question: string]: string;
        };
    };
};

const severityQuestions: Record<ConditionType, string[]> = {
    Diabetes: [
        'How often do you check your blood sugar?',
        'Do you experience frequent thirst or urination?',
        'Are you taking insulin?',
    ],
    Hypertension: [
        'Do you regularly monitor your blood pressure?',
        'Do you experience headaches or dizziness?',
        'Are you on any blood pressure medication?',
    ],
    Cardiovascular: [
        'Do you experience chest pain or palpitations?',
        'Have you had any heart procedures?',
    ],
    Respiratory: [
        'Do you experience shortness of breath?',
        'Do you use inhalers or oxygen?',
    ],
    Kidney: [
        'Have you been diagnosed with chronic kidney disease?',
        'Do you undergo dialysis?',
    ],
};

const DiseaseSelectionForm = () => {
    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<DiseaseFormValues>({
        defaultValues: {
            secondaryConditions: [],
            severity: {},
        },
    });

    const primaryCondition = watch('primaryCondition');
    const secondaryConditions = watch('secondaryConditions');


    const renderSeverityQuestions = (condition: ConditionType) => {
        const questions = severityQuestions[condition];
        if (!questions) return null;

        return (
            <div className="mt-4 space-y-4">
                <p className="font-semibold text-lg">
                    {condition} Severity Assessment
                </p>
                {questions.map((question, idx) => (
                    <div key={question}>
                        <Label>{question}</Label>
                        <Input
                            type="text"
                            {...register(`severity.${condition}.${question}`, {
                                required: 'Required',
                            })}
                        />
                    </div>
                ))}
            </div>
        );
    };

    const handleFormSubmit = async (data: DiseaseFormValues) => {
        try {
            await axios.post('http://localhost:3001/api/disease', data);
            alert('Disease selsction form data submitted!');
            reset();
        } catch (error) {
            console.error('Error saving disease selection:', error);
            alert('Failed to submit selected diseases');
        }
    };

    return (
        <div>
            <h2 className="text-2xl">Disease Selection</h2>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">

                {/* Primary Condition */}
                <div>
                    <Label htmlFor="primaryCondition">Primary Condition</Label>
                    <select id="primaryCondition" {...register('primaryCondition', { required: 'Required' })}>
                        <option value="">Select...</option>
                        <option value="Diabetes">Diabetes</option>
                        <option value="Hypertension">Hypertension</option>
                        <option value="Cardiovascular">Cardiovascular</option>
                        <option value="Respiratory">Respiratory</option>
                        <option value="Kidney">Kidney</option>
                    </select>
                    {errors.primaryCondition && (
                        <p className="text-red-400">{errors.primaryCondition.message}</p>
                    )}
                </div>

                {/* Secondary Conditions */}
                <div>
                    <Label>Secondary Conditions (Optional)</Label>
                    <div className="flex flex-wrap gap-4 mt-2">
                        {(Object.keys(severityQuestions) as ConditionType[]).map((condition) => (
                            <label key={condition} className="flex items-center gap-2">
                                <Input
                                    type="checkbox"
                                    value={condition}
                                    {...register('secondaryConditions')}
                                />
                                {condition}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Conditional Severity Questions */}
                {primaryCondition && renderSeverityQuestions(primaryCondition)}
                {secondaryConditions?.map((cond) =>
                    cond !== primaryCondition ? (
                        <React.Fragment key={cond}>
                            {renderSeverityQuestions(cond as ConditionType)}
                        </React.Fragment>
                    ) : null
                )}

                <Button type="submit" className="mt-6">
                    Submit
                </Button>
            </form>
        </div>
    );
};

export default DiseaseSelectionForm;
