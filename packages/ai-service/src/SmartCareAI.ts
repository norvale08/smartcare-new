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

  async checkDrugInteractions(medications: string[]): Promise<string> {
    const prompt = [
      `You are a medical AI assistant.`,
      `Analyze the following list of medications for any drug-drug interactions.`,
      `List the drugs that should not be taken together, indicate the level of severity (Low, Medium, High), and explain the reason for the interaction.`,
      `If no issues are found, say "No known interactions found."`,
      '',
      `Medications: ${medications.join(', ')}`,
    ].join('\n');

    const { message } = await this.ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content;
  }
}
