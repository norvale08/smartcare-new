import { MedicationModel } from "../../../models/medicationModels";
import { connectMongoDB } from "../../../lib/mongodb";

// Helper function to calculate end date
const calculateEndDate = (startDate: Date, duration: string): Date | null => {
  if (!duration || duration.toLowerCase() === 'ongoing') {
    return null;
  }

  const start = new Date(startDate);
  const durationLower = duration.toLowerCase();

  // Extract number from duration
  const match = durationLower.match(/(\d+)/);
  if (!match) return null;

  const value = parseInt(match[1]);

  if (durationLower.includes('day')) {
    start.setDate(start.getDate() + value);
  } else if (durationLower.includes('week')) {
    start.setDate(start.getDate() + (value * 7));
  } else if (durationLower.includes('month')) {
    start.setMonth(start.getMonth() + value);
  } else if (durationLower.includes('year')) {
    start.setFullYear(start.getFullYear() + value);
  } else {
    return null;
  }

  return start;
};

export const prescribeMedication = async (req: any, res: any) => {
  try {
    const {
      patientId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      startDate,
      reminders,
      patientAllergies,
      potentialSideEffects,
      medicationImage
    } = req.body;

    // Validation
    if (!patientId || !medicationName || !dosage || !frequency) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, medicationName, dosage, frequency"
      });
    }

    await connectMongoDB();

    const medStartDate = startDate ? new Date(startDate) : new Date();
    const endDate = calculateEndDate(medStartDate, duration);

    const medication = new MedicationModel({
      patientId,
      prescribedBy: req.userId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      startDate: medStartDate,
      endDate,
      reminders: reminders || [],
      patientAllergies: patientAllergies || [],
      potentialSideEffects: potentialSideEffects || [],
      status: 'active',
      adherence: {
        currentStatus: 'taken',
        history: []
      },
      experiencedSideEffects: [],
      takenHistory: [],
      weeklyAdherence: {},
      expiryAlert: {
        sent: false,
        daysBeforeExpiry: 3
      }
    });

    await medication.save();

    res.json({
      success: true,
      message: "Medication prescribed successfully",
      data: medication
    });

  } catch (error: any) {
    console.error('❌ Error prescribing medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to prescribe medication",
      error: error.message
    });
  }
};