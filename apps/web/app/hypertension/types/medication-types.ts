// FILE: apps/web/app/patient/types/medication-types.ts

export interface Allergy {
  allergyName: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  notes?: string;
}

export interface PotentialSideEffect {
  name: string;
  severity: 'common' | 'uncommon' | 'rare';
  description?: string;
}

export interface ExperiencedSideEffect {
  sideEffectName: string;
  reportedAt: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  intensity?: string;
  resolved?: boolean;
  resolvedAt?: string;
  doctorNotes?: string;
  doctorId?: string;
  lastUpdated?: string;
}

export interface Medication {
  _id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  /** Optional free-form duration (e.g., "7 days", "2 weeks") */
  duration?: string;
  /** Optional start date for the course (ISO or YYYY-MM-DD) */
  startDate?: string;
  /** Optional creation timestamp if provided by backend */
  createdAt?: string;
  instructions: string;
  reminders: string[];
  status: 'active' | 'completed' | 'missed' | 'stopped';
  adherence?: {
    currentStatus: 'taken' | 'missed' | 'stopped';
    reasonForStopping?: string;
    stoppedAt?: string;
    history?: Array<{
      date: string;
      status: string;
      reason?: string;
      notes?: string;
    }>;
  };
  patientAllergies: Allergy[];
  potentialSideEffects: PotentialSideEffect[];
  experiencedSideEffects: ExperiencedSideEffect[];
  lastTaken?: string;
  takenHistory?: Array<{
    takenAt: string;
    doseTime: string;
  }>;
  prescribedBy?: {
    fullName: string;
    specialization?: string;
  };
}

export interface WeekDay {
  name: string;
  date: string;
  formatted: string;
  isToday: boolean;
  isPast: boolean;
}

export interface WeeklyMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  status: string;
  patientAllergies: Allergy[];
  experiencedSideEffects: ExperiencedSideEffect[];
  weeklyData: {
    [date: string]: {
      taken: boolean;
      status: 'pending' | 'taken' | 'missed' | 'stopped';
      takenTime: string | null;
      isToday: boolean;
      isPast: boolean;
    };
  };
  prescribedBy?: {
    fullName: string;
    specialization?: string;
  };
}

export interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  weekDays: WeekDay[];
  medications: WeeklyMedication[];
  summary: {
    totalMedications: number;
    activeMedications: number;
    takenThisWeek: number;
    missedThisWeek: number;
    pendingThisWeek: number;
  };
}

export interface WeeklyResponse {
  success: boolean;
  data?: WeeklyData;
  message?: string;
}