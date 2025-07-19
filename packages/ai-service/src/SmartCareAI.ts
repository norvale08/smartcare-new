import { Ollama } from 'ollama';

export interface PatientData {
  name: string;
  age: number;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  symptoms: string[];
  conditions: string[];
  language: 'en' | 'sw';
}

export interface GlucoseData {
  glucose: number;
  context: 'Fasting' | 'Post-meal' | 'Random';
  language: 'en' | 'sw';
}

export interface MedicationData {
  medications: string[];
  patientAge?: number;
  conditions?: string[];
  language: 'en' | 'sw';
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'Low' | 'Medium' | 'High';
  warning: string;
  recommendation: string;
}

export interface MedicationAnalysis {
  interactions: DrugInteraction[];
  generalRecommendations: string;
  safetyNotes: string;
}

export class SmartCareAI {
  private ollama = new Ollama({ host: 'http://localhost:11434' });
  private model = 'llama3.2:3b';

  async generateHealthSummary(patient: PatientData): Promise<string> {
    const prompt = [
      `You are a friendly healthcare AI assistant.`,
      patient.language === 'sw'
        ? `Please answer in Swahili.`
        : `Please answer in English.`,
      '',
      `Patient: ${patient.name}, age ${patient.age}`,
      `Blood pressure: ${patient.bloodPressure}`,
      `Heart rate: ${patient.heartRate} bpm`,
      `Temperature: ${patient.temperature} °C`,
      `Symptoms: ${patient.symptoms.join(', ') || 'none'}`,
      `Conditions: ${patient.conditions.join(', ') || 'none'}`,
      '',
      `Give a brief health summary with:`,
      `1. Current status`,
      `2. Any concerns`,
      `3. Simple, reassuring recommendations`,
    ].join('\n');

    const { message } = await this.ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content;
  }

  async generateGlucoseFeedback(glucoseData: GlucoseData): Promise<string> {
    const { glucose, context, language } = glucoseData;

    const ranges = {
      'Fasting': { normal: '70-100', prediabetic: '100-125', diabetic: '≥126' },
      'Post-meal': { normal: '<140', prediabetic: '140-199', diabetic: '≥200' },
      'Random': { normal: '<140', prediabetic: '140-199', diabetic: '≥200' }
    };

    const currentRange = ranges[context];

    const prompt = [
      `You are a friendly healthcare AI assistant specializing in diabetes management.`,
      language === 'sw'
        ? `Please answer in Swahili. Use medical terms that are commonly understood in Kenya.`
        : `Please answer in English.`,
      '',
      `Blood glucose reading: ${glucose} mg/dL`,
      `Context: ${context}`,
      `Normal range for ${context}: ${currentRange.normal} mg/dL`,
      `Pre-diabetic range: ${currentRange.prediabetic} mg/dL`,
      `Diabetic range: ${currentRange.diabetic} mg/dL`,
      '',
      `Please provide:`,
      `1. Assessment of this glucose level (normal, elevated, or concerning)`,
      `2. What this reading means for the patient`,
      `3. Practical recommendations (diet, exercise, monitoring)`,
      `4. When to seek medical attention if needed`,
      `5. Use encouraging and supportive tone`,
      '',
      `Keep the response clear, reassuring, and actionable. Avoid complex medical jargon.`,
      `If the reading is concerning, emphasize consulting a healthcare provider.`
    ].join('\n');

    const { message } = await this.ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content;
  }

  async analyzeMedications(medicationData: MedicationData): Promise<MedicationAnalysis> {
    const { medications, patientAge, conditions, language } = medicationData;

    const prompt = [
      `You are a clinical pharmacist AI assistant specializing in drug interactions and medication safety.`,
      language === 'sw'
        ? `Please respond in Swahili, using medical terms commonly understood in Kenya.`
        : `Please respond in English.`,
      '',
      `PATIENT MEDICATIONS: ${medications.join(', ')}`,
      patientAge ? `Patient age: ${patientAge} years` : '',
      conditions && conditions.length > 0 ? `Medical conditions: ${conditions.join(', ')}` : '',
      '',
      `Please analyze these medications and provide a JSON response with this exact structure:`,
      `{`,
      `  "interactions": [`,
      `    {`,
      `      "drug1": "medication name",`,
      `      "drug2": "interacting medication name",`,
      `      "severity": "Low|Medium|High",`,
      `      "warning": "brief description of the interaction",`,
      `      "recommendation": "what the patient should do"`,
      `    }`,
      `  ],`,
      `  "generalRecommendations": "overall medication management advice for the patient",`,
      `  "safetyNotes": "important safety considerations"`,
      `}`,
      '',
      `IMPORTANT: Only return valid JSON. If no interactions are found, return empty array for interactions.`,
      `Focus on clinically significant interactions only. Be conservative and emphasize consulting healthcare providers for any concerns.`
    ].join('\n');

    try {
      const { message } = await this.ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      });
      console.log("🔍 Raw Ollama response:", message.content);


      // Try to parse the JSON response
      const cleanResponse = message.content.trim();
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      } else {
        // Fallback if JSON parsing fails
        return {
          interactions: [],
          generalRecommendations: message.content,
          safetyNotes: "Please consult with your healthcare provider about your medications."
        };
      }
    } catch (error) {
      console.error('Error analyzing medications:', error);
      return {
        interactions: [],
        generalRecommendations: "Unable to analyze medications at this time. Please consult your healthcare provider.",
        safetyNotes: "Always inform your healthcare provider about all medications you are taking."
      };
    }
  }

  async generateMedicationReminders(medications: string[], language: 'en' | 'sw' = 'en'): Promise<string> {
    const prompt = [
      `You are a helpful healthcare AI assistant.`,
      language === 'sw'
        ? `Please respond in Swahili.`
        : `Please respond in English.`,
      '',
      `Patient medications: ${medications.join(', ')}`,
      '',
      `Generate helpful medication reminders and tips including:`,
      `1. Best times to take medications`,
      `2. Whether to take with or without food`,
      `3. Important timing considerations`,
      `4. Simple adherence tips`,
      '',
      `Keep it practical and easy to understand. Be encouraging and supportive.`
    ].join('\n');

    const { message } = await this.ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content;
  }
}