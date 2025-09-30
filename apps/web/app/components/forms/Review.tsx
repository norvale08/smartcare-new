"use client";
import React from "react";
import { useFormContext } from "react-hook-form";

interface ReviewStepProps {
  goToStep: (step: number) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ goToStep }) => {
  const { getValues } = useFormContext();
  const values = getValues();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Review Your Information</h2>

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-2">Basic Info</h3>
          <p><strong>Full Name:</strong> {values.fullName}</p>
          <p><strong>Date of Birth:</strong> {values.dob}</p>
          <p><strong>Gender:</strong> {values.gender}</p>
          <p><strong>Weight:</strong> {values.weight}</p>
          <p><strong>Height:</strong> {values.height}</p>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="text-blue-600 text-sm underline mt-2"
          >
            Edit
          </button>
        </section>

        {/* Emergency Contact */}
        <section className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-2">Emergency Contact</h3>
          <p><strong>First Name:</strong> {values.firstname}</p>
          <p><strong>Last Name:</strong> {values.lastname}</p>
          <p><strong>Phone:</strong> {values.phoneNumber}</p>
          <p><strong>Relationship:</strong> {values.relationship}</p>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="text-blue-600 text-sm underline mt-2"
          >
            Edit
          </button>
        </section>

        {/* Conditions */}
        <section className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-2">Conditions</h3>
          <p><strong>Hypertension:</strong> {values.hypertension ? "Yes" : "No"}</p>
          <p><strong>Diabetes:</strong> {values.diabetes ? "Yes" : "No"}</p>
          <p><strong>Cardiovascular:</strong> {values.cardiovascular ? "Yes" : "No"}</p>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="text-blue-600 text-sm underline mt-2"
          >
            Edit
          </button>
        </section>

        {/* Medical History */}
        <section className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-2">Medical History</h3>
          <p><strong>Surgeries:</strong> {values.surgeries}</p>
          <p><strong>Allergies:</strong> {values.allergies}</p>
          <p><strong>Other Conditions:</strong> {values.conditions}</p>
          <button
            type="button"
            onClick={() => goToStep(4)}
            className="text-blue-600 text-sm underline mt-2"
          >
            Edit
          </button>
        </section>
      </div>
    </div>
  );
};

export default ReviewStep;
