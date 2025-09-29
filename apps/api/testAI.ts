import { SmartCareAI,GlucoseData} from "../api/src/services/SmartCareAI"
import dotenv from "dotenv";

dotenv.config();

async function testAI() {
  const ai = new SmartCareAI();

  const sampleData: GlucoseData = {
    glucose: 180,
    context: "Post-meal",
    language: "en",
  };

  console.log("⏳ Generating summary...");
  const summary = await ai.generateSummary(sampleData);
  console.log("Summary:", summary);

  console.log("\n⏳ Generating feedback...");
  const feedback = await ai.generateGlucoseFeedback(sampleData);
  console.log("Feedback:", feedback);
}

testAI();
