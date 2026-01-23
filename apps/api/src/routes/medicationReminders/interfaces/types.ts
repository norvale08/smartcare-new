// apps/api/src/routes/medicationReminders/interfaces/types.ts
export interface SideEffect {
  sideEffectName: string;
  severity?: "mild" | "moderate" | "severe";
  reportedAt: Date;
  notes?: string;
  intensity?: string;
  lastUpdated?: Date;
  toObject?: () => any;
}

export interface WeekDay {
  name: string;
  date: string;        // YYYY-MM-DD
  formatted: string;   // e.g. Mon, Sep 16
  isToday: boolean;
  isPast: boolean;
}

export interface WeeklyMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  status: string;
  patientAllergies: any[];
  experiencedSideEffects: any[];
  weeklyData: {
    [date: string]: {
      taken: boolean;
      status: 'pending' | 'taken' | 'missed' | 'stopped';
      takenTime: string | null;
      isToday: boolean;
      isPast: boolean;
    };
  };
}