import { SmartCareAI } from './SmartCareAI.js';

const ai = new SmartCareAI();
const patient = {
  name: "Jane Doe",
  age: 45,
  bloodPressure: "120/80",
  heartRate: 75,
  temperature: 36.8,
  symptoms: ["fatigue", "dizziness"],
  conditions: ["hypertension"],
  language: "sw" as const, // ✅ This is the fix
};


(async () => {
  const summary = await ai.generateHealthSummary(patient);
  console.log("\n🩺 Health Summary:\n", summary);
})();
