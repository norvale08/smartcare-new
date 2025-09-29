"use client";
import React, { useState } from "react";
import { Button } from "@repo/ui";
import { toast } from "react-hot-toast";
import { FaPills, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";

interface MedicationData {
  name: string;
  adherence: "" | "prescribed" | "missed" | "stopped";
}

interface Props {
  onSubmit?: (data: MedicationData[]) => void;
}

const medicationsList: string[] = [
  "Metformin",
  "Insulin",
  "Glipizide",
  "Pioglitazone",
  "Dapagliflozin",
];

const adherenceOptions: {
  label: string;
  value: MedicationData["adherence"];
  icon: JSX.Element;
}[] = [
  {
    label: "As Prescribed",
    value: "prescribed",
    icon: <FaCheckCircle className="text-green-600 text-2xl" />,
  },
  {
    label: "Missed Dose",
    value: "missed",
    icon: <FaClock className="text-yellow-600 text-2xl" />,
  },
  {
    label: "Stopped",
    value: "stopped",
    icon: <FaTimesCircle className="text-red-600 text-2xl" />,
  },
];

const DiabetesMedications: React.FC<Props> = ({ onSubmit }) => {
  const [medications, setMedications] = useState<MedicationData[]>(
    medicationsList.map((m) => ({ name: m, adherence: "" }))
  );

  const handleAdherence = (
    medName: string,
    value: MedicationData["adherence"]
  ) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.name === medName ? { ...m, adherence: value } : m
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (medications.some((m) => m.adherence === "")) {
      toast.error("Please select adherence for all medications.");
      return;
    }

    toast.success("Medication adherence saved");
    onSubmit?.(medications);
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
        <FaPills className="text-blue-500" /> 💊 Medications
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {medications.map((med) => (
          <div key={med.name} className="space-y-3">
            <p className="font-medium text-gray-700">{med.name}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {adherenceOptions.map((opt) => {
                const selected = med.adherence === opt.value;
                return (
                  <div
                    key={opt.value}
                    role="button"
                    title={opt.label}
                    onClick={() => handleAdherence(med.name, opt.value)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white shadow-md"
                        : "border-gray-200 hover:border-blue-300 bg-gray-50"
                    }`}
                  >
                    <div className={selected ? "text-white" : ""}>
                      {opt.icon}
                    </div>
                    <span className="mt-2 text-sm font-medium">
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
        >
          Save Medications
        </Button>
      </form>
    </div>
  );
};

export default DiabetesMedications;
