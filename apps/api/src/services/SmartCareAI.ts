import ollama from "ollama";

export interface GlucoseData {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  language?: "en" | "sw";
}

export interface LifestyleData {
  alcohol?: string;
  smoking?: string;
  exercise?: string;
  sleep?: string;
}

export interface LifestyleAIInput extends GlucoseData {
  lifestyle: LifestyleData;
}

export interface VitalsData {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  weight?: number;
  height?: number;
  age?: number;
  language?: "en" | "sw";
}

export interface FoodAdviceInput extends VitalsData {
  lifestyle?: LifestyleData;
  medicalHistory?: string[];
  allergies?: string[];
}

export class SmartCareAI {
  private model = process.env.OLLAMA_MODEL || "llama3.2:3b";

  // ✅ Summarize glucose reading
  async generateSummary(data: GlucoseData): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant.
        Summarize the patient's glucose reading in 1–2 sentences max.
        If language is "sw", respond in Kiswahili. Otherwise, use English.

        Data: ${JSON.stringify(data)}
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
      }

      return content.trim() || "⚠️ No summary available.";
    } catch (err) {
      console.error("AI error (summary):", err);
      return "❌ Could not generate summary.";
    }
  }

  // ✅ Provide glucose feedback
  async generateGlucoseFeedback(data: GlucoseData): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant.
        Provide a short health interpretation of this glucose reading.
        Mention whether it is normal, high, or low, and give a brief recommendation.
        Respond in Kiswahili if language is "sw", otherwise use English.

        Data: ${JSON.stringify(data)}
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
      }

      return content.trim() || "⚠️ No feedback available.";
    } catch (err) {
      console.error("AI error (feedback):", err);
      return "❌ Could not generate AI feedback.";
    }
  }

  // ✅ Lifestyle-based AI advice  
  async generateLifestyleFeedback(data: LifestyleAIInput): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant specializing in diabetes care.
        
        Patient Information:
        - Current glucose: ${data.glucose} mg/dL (${data.context})
        - Alcohol consumption: ${data.lifestyle.alcohol}
        - Smoking habit: ${data.lifestyle.smoking}
        - Exercise frequency: ${data.lifestyle.exercise}
        - Sleep pattern: ${data.lifestyle.sleep}
        
        Provide personalized lifestyle advice in 3-4 sentences that:
        1. Comments on their current glucose level
        2. Addresses their specific lifestyle factors
        3. Gives actionable recommendations for improvement
        4. Mentions any concerning patterns
        
        ${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}
        
        Keep the tone supportive and encouraging while being medically accurate.
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
      }

      return content.trim() || "⚠️ No lifestyle advice available.";
    } catch (err) {
      console.error("AI error (lifestyle advice):", err);
      return "❌ Could not generate lifestyle AI advice.";
    }
  }

  // 🆕 Generate Kenyan food recommendations based on vitals
  async generateKenyanFoodAdvice(data: FoodAdviceInput): Promise<string> {
    try {
      const bmi = data.weight && data.height ? (data.weight / Math.pow(data.height / 100, 2)).toFixed(1) : null;
      const bpStatus = data.bloodPressure ? 
        (data.bloodPressure.systolic >= 140 || data.bloodPressure.diastolic >= 90 ? "High" : 
         data.bloodPressure.systolic >= 120 || data.bloodPressure.diastolic >= 80 ? "Elevated" : "Normal") : "Unknown";

      const kenyanFoods = {
        grains: ["ugali (whole wheat)", "brown rice", "millet porridge", "sorghum", "quinoa", "oats", "arrow root (nduma)"],
        vegetables: ["sukuma wiki (kale)", "spinach (mchicha)", "terere (amaranth)", "kunde (cowpeas leaves)", "mrenda (jute mallow)", "managu (African nightshade)", "pumpkin leaves", "sweet potato leaves"],
        proteins: ["fish (tilapia, salmon)", "chicken (grilled/boiled)", "beans", "lentils (dengu)", "green grams (ndengu)", "githeri", "eggs", "lean beef (small portions)"],
        fruits: ["avocado", "passion fruit", "guava", "papaya", "oranges", "apples", "watermelon", "pineapple (small portions)"],
        healthyFats: ["avocado", "nuts (groundnuts)", "seeds", "olive oil", "fish oil"],
        avoid: ["white ugali", "white rice", "chapati (frequent)", "mandazi", "soda", "processed foods", "excess red meat"]
      };

      const prompt = `
        You are a Kenyan nutritionist specializing in diabetes management. 
        
        Patient Vitals:
        - Blood glucose: ${data.glucose} mg/dL (${data.context})
        - Blood pressure: ${data.bloodPressure ? `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic} mmHg (${bpStatus})` : "Not provided"}
        - BMI: ${bmi ? `${bmi} kg/m²` : "Not calculated"}
        - Age: ${data.age || "Not provided"}
        ${data.lifestyle ? `- Exercise: ${data.lifestyle.exercise}, Alcohol: ${data.lifestyle.alcohol}` : ""}
        
        Available Kenyan Foods:
        - Grains: ${kenyanFoods.grains.join(", ")}
        - Vegetables: ${kenyanFoods.vegetables.join(", ")}
        - Proteins: ${kenyanFoods.proteins.join(", ")}
        - Fruits: ${kenyanFoods.fruits.join(", ")}
        - Healthy fats: ${kenyanFoods.healthyFats.join(", ")}
        - Foods to limit: ${kenyanFoods.avoid.join(", ")}

        Provide a comprehensive Kenyan food plan that:
        1. Addresses their current glucose level and blood pressure
        2. Suggests specific Kenyan meals for breakfast, lunch, and dinner
        3. Mentions portion sizes and timing
        4. Includes traditional Kenyan foods that are diabetes-friendly
        5. Gives specific cooking methods (e.g., boiling, steaming vs frying)
        6. Mentions foods to avoid or limit
        
        Format as a practical meal plan they can follow immediately.
        ${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}
        
        Keep the advice culturally relevant, practical, and affordable for Kenyan context.
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
      }

      return content.trim() || "⚠️ No food advice available.";
    } catch (err) {
      console.error("AI error (food advice):", err);
      return "❌ Could not generate food advice.";
    }
  }

  // 🆕 Generate quick food recommendations for specific situations
  async generateQuickFoodTips(data: { glucose: number; context: string; language?: string }): Promise<string> {
    try {
      const prompt = `
        You are a Kenyan nutritionist. 
        The patient has a glucose reading of ${data.glucose} mg/dL (${data.context}).
        
        Provide 3-4 immediate Kenyan food recommendations or warnings based on this reading:
        - If high glucose: foods to avoid right now and what to eat to help lower it
        - If low glucose: immediate Kenyan foods to help raise glucose safely
        - If normal: foods to maintain stable levels
        
        Use common Kenyan foods like ugali, sukuma wiki, githeri, fruits, etc.
        ${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}
        
        Keep it brief (2-3 sentences) and actionable.
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
      }

      return content.trim() || "⚠️ No quick tips available.";
    } catch (err) {
      console.error("AI error (quick food tips):", err);
      return "❌ Could not generate quick food tips.";
    }
  }
}