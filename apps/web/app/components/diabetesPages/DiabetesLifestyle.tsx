"use client";
import React, { useState } from "react";
import { Button } from "@repo/ui";
import { toast } from "react-hot-toast";
import axios from "axios";

// React Icons
import { FaWineGlassAlt, FaBeer, FaSmoking, FaBan, FaBed, FaRunning, FaCouch } from "react-icons/fa";
import { MdSmokeFree, MdFitnessCenter, MdAccessTime } from "react-icons/md";

interface LifestyleData {
  alcohol?: string;
  smoking?: string;
  exercise?: string;
  sleep?: string;
}

interface Props {
  onSubmit?: (data: LifestyleData) => void;
  userId: string; // required for AI advice
}

const options = {
  alcohol: [
    { label: "None", icon: <FaBan className="text-xl text-gray-700" /> },
    { label: "Occasionally", icon: <FaWineGlassAlt className="text-xl text-red-500" /> },
    { label: "Frequently", icon: <FaBeer className="text-xl text-yellow-600" /> },
  ],
  smoking: [
    { label: "None", icon: <MdSmokeFree className="text-xl text-green-600" /> },
    { label: "Light", icon: <FaSmoking className="text-xl text-gray-600" /> },
    { label: "Heavy", icon: <FaSmoking className="text-xl text-red-600" /> },
  ],
  exercise: [
    { label: "Daily", icon: <FaRunning className="text-xl text-blue-600" /> },
    { label: "Few times/week", icon: <MdFitnessCenter className="text-xl text-purple-600" /> },
    { label: "Rarely", icon: <FaCouch className="text-xl text-gray-600" /> },
    { label: "None", icon: <FaBan className="text-xl text-red-600" /> },
  ],
  sleep: [
    { label: "<5 hrs", icon: <FaBed className="text-xl text-red-600" /> },
    { label: "6-7 hrs", icon: <FaBed className="text-xl text-yellow-600" /> },
    { label: "7-8 hrs", icon: <FaBed className="text-xl text-green-600" /> },
    { label: ">8 hrs", icon: <FaBed className="text-xl text-blue-600" /> },
    { label: "Irregular", icon: <MdAccessTime className="text-xl text-gray-600" /> },
  ],
};

const DiabetesLifestyle: React.FC<Props> = ({ onSubmit, userId }) => {
  const [form, setForm] = useState<LifestyleData>({
    alcohol: "",
    smoking: "",
    exercise: "",
    sleep: "",
  });

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (field: keyof LifestyleData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Lifestyle data saved");

    onSubmit?.(form);

    if (!userId) {
      console.warn("No userId provided — skipping AI advice");
      return;
    }

    // Send to backend for AI advice
    try {
      setLoading(true);
      const resp = await axios.post("/api/diabetesLifestyle", { ...form, userId });
      setAiAdvice(resp.data.lifestyleAdvice || "No advice available");
    } catch (err: any) {
      console.error("AI advice fetch error:", err.message);
      toast.error("Failed to get AI advice");
    } finally {
      setLoading(false);
    }
  };

  const renderOptions = (
    field: keyof LifestyleData,
    title: string,
    opts: { label: string; icon: React.ReactNode }[]
  ) => (
    <div>
      <h4 className="text-md font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {opts.map(opt => (
          <div
            key={opt.label}
            onClick={() => handleSelect(field, opt.label)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition ${
              form[field] === opt.label
                ? "border-blue-600 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300 bg-gray-50"
            }`}
          >
            {opt.icon}
            <span className="mt-2 text-sm font-medium">{opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <h3 className="text-lg font-bold text-blue-600 mb-4">🧑‍⚕️ Lifestyle Information</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderOptions("alcohol", "Alcohol Intake", options.alcohol)}
        {renderOptions("smoking", "Smoking", options.smoking)}
        {renderOptions("exercise", "Exercise", options.exercise)}
        {renderOptions("sleep", "Sleep (hours/night)", options.sleep)}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
        >
          Save Lifestyle Info
        </Button>
      </form>

      {/* ✅ Dynamic AI Lifestyle Advice */}
      {loading ? (
        <p className="text-gray-500 mt-2">Generating AI advice...</p>
      ) : aiAdvice ? (
        <div className="mt-4 p-4 bg-gray-50 border-l-4 border-blue-600 rounded">
          <h4 className="text-md font-semibold text-blue-600 mb-2">🤖 Lifestyle Advice</h4>
          <p className="text-gray-700 whitespace-pre-line">{aiAdvice}</p>
        </div>
      ) : null}
    </div>
  );
};

export default DiabetesLifestyle;
