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

export class SmartCareAI {
  private ollama = new Ollama({ host: 'http://localhost:11434' });
  private model = 'llama3.2:3b';

  async generateHealthSummary(patient: PatientData): Promise<string> {
    /* ---------- prompt ---------- */
    const prompt = [
      `You are a friendly healthcare AI assistant.`,
      patient.language === 'sw'
        ? `Please answer in Swahili.`
        : `Please answer in English.`,
      '',
      `Patient: ${patient.name}, age ${patient.age}`,
      `Blood pressure: ${patient.bloodPressure}`,
      `Heart rate: ${patient.heartRate} bpm`,
      `Temperature: ${patient.temperature} °C`,
      `Symptoms: ${patient.symptoms.join(', ') || 'none'}`,
      `Conditions: ${patient.conditions.join(', ') || 'none'}`,
      '',
      `Give a brief health summary with:`,
      `1. Current status`,
      `2. Any concerns`,
      `3. Simple, reassuring recommendations`,
    ].join('\n');
    /* ---------------------------- */

    const { message } = await this.ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content;
  }
}
