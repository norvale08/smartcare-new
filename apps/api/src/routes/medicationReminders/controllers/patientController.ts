// apps/api/src/routes/medicationReminders/controllers/patientController.ts
import { MedicationModel } from "../../../models/medicationModels";
import { connectMongoDB } from "../../../lib/mongodb";
import { mapToObject } from "../helpers";
import { WeekDay, WeeklyMedication } from "../interfaces/types";

export const getWeeklyAdherence = async (req: any, res: any) => {
  try {
    const { weekStart } = req.query;
    
    await connectMongoDB();

    // Calculate start and end of week
    const today = new Date();
    let currentWeekStart: Date;
    
    if (weekStart && typeof weekStart === 'string' && weekStart.trim() !== '') {
      currentWeekStart = new Date(weekStart);
      currentWeekStart.setHours(0, 0, 0, 0);
    } else {
      currentWeekStart = new Date(today);
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);
    }
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Get all medications for the patient
    const medications = await MedicationModel.find({
      patientId: req.userId
    })
    .populate('prescribedBy', 'fullName specialization')
    .select('medicationName dosage frequency status adherence takenHistory weeklyAdherence patientAllergies experiencedSideEffects');

    // Format days of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekDays: WeekDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      weekDays.push({
        name: daysOfWeek[i],
        date: dateStr,
        formatted: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: dateStr === todayStr,
        isPast: day < today
      });
    }

    // Process each medication for weekly adherence
    const weeklyAdherence: WeeklyMedication[] = medications.map(medication => {
      const medAdherence: WeeklyMedication = {
        medicationId: medication._id.toString(),
        medicationName: medication.medicationName,
        dosage: medication.dosage,
        frequency: medication.frequency,
        status: medication.status,
        patientAllergies: medication.patientAllergies || [],
        experiencedSideEffects: medication.experiencedSideEffects || [],
        weeklyData: {}
      };

      // Initialize weekly data structure
      weekDays.forEach(day => {
        medAdherence.weeklyData[day.date] = {
          taken: false,
          status: 'pending' as 'pending' | 'taken' | 'missed' | 'stopped',
          takenTime: null,
          isToday: day.isToday,
          isPast: day.isPast
        };
      });

      // Check taken history for this week
      if (medication.takenHistory && medication.takenHistory.length > 0) {
        medication.takenHistory.forEach((entry: any) => {
          const takenDate = new Date(entry.takenAt);
          const takenDateStr = takenDate.toISOString().split('T')[0];
          
          if (takenDate >= currentWeekStart && takenDate <= currentWeekEnd) {
            if (medAdherence.weeklyData[takenDateStr]) {
              medAdherence.weeklyData[takenDateStr] = {
                taken: true,
                status: 'taken',
                takenTime: entry.doseTime || takenDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isToday: takenDateStr === today.toISOString().split('T')[0],
                isPast: takenDate < today
              };
            }
          }
        });
      }

      // Check weeklyAdherence field
      if (medication.weeklyAdherence) {
        let weeklyAdherenceData = mapToObject(medication.weeklyAdherence);
        
        Object.entries(weeklyAdherenceData).forEach(([dateKey, value]: [string, any]) => {
          try {
            const date = new Date(dateKey);
            if (date >= currentWeekStart && date <= currentWeekEnd) {
              if (medAdherence.weeklyData[dateKey]) {
                const valueObj = value.toObject ? value.toObject() : value;
                medAdherence.weeklyData[dateKey] = {
                  ...medAdherence.weeklyData[dateKey],
                  ...valueObj
                };
              }
            }
          } catch (error) {
            console.log("Error processing date:", dateKey, error);
          }
        });
      }

      // For active medications, mark past days as missed if not taken
      if (medication.status === 'active') {
        weekDays.forEach(day => {
          if (day.isPast && !medAdherence.weeklyData[day.date].taken) {
            medAdherence.weeklyData[day.date].status = 'missed';
          }
        });
      }

      // For stopped medications, mark all days as stopped
      if (medication.status === 'stopped') {
        weekDays.forEach(day => {
          medAdherence.weeklyData[day.date].status = 'stopped';
        });
      }

      return medAdherence;
    });

    // Calculate summary
    const activeMedications = medications.filter(m => m.status === 'active').length;
    const takenThisWeek = weeklyAdherence.reduce((count, med) => {
      return count + Object.values(med.weeklyData).filter((day: any) => day.taken).length;
    }, 0);
    const missedThisWeek = weeklyAdherence.reduce((count, med) => {
      return count + Object.values(med.weeklyData).filter((day: any) => day.status === 'missed').length;
    }, 0);
    const pendingThisWeek = weeklyAdherence.reduce((count, med) => {
      return count + Object.values(med.weeklyData).filter((day: any) => 
        day.status === 'pending' && !day.isPast
      ).length;
    }, 0);

    const response = {
      success: true,
      data: {
        weekStart: currentWeekStart.toISOString(),
        weekEnd: currentWeekEnd.toISOString(),
        weekDays,
        medications: weeklyAdherence,
        summary: {
          totalMedications: medications.length,
          activeMedications,
          takenThisWeek,
          missedThisWeek,
          pendingThisWeek
        }
      }
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ Error fetching weekly adherence:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly adherence data",
      error: error.message
    });
  }
};

export const markMedicationTaken = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { dayDate } = req.body;

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    let takenDate: Date;
    if (dayDate && typeof dayDate === 'string') {
      const parsedDate = new Date(dayDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD format."
        });
      }
      takenDate = parsedDate;
    } else {
      takenDate = new Date();
    }

    const dateKey = takenDate.toISOString().split('T')[0];
    const currentTime = takenDate.toTimeString().slice(0, 5);

    // Update medication status
    medication.lastTaken = takenDate;
    
    if (!medication.takenHistory) {
      medication.takenHistory = [];
    }
    
    medication.takenHistory.push({
      takenAt: takenDate,
      doseTime: currentTime
    });

    // Update weekly adherence
    if (!medication.weeklyAdherence) {
      medication.weeklyAdherence = new Map();
    }
    
    medication.weeklyAdherence.set(dateKey, {
      taken: true,
      status: 'taken',
      takenTime: currentTime,
      markedAt: new Date()
    });

    // Update adherence
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'taken',
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'taken';
    }

    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: takenDate,
      status: 'taken'
    });

    await medication.save();

    res.json({
      success: true,
      message: "Medication marked as taken",
      data: {
        medicationId: medication._id,
        date: dateKey,
        status: 'taken',
        takenTime: currentTime,
        weeklyAdherence: mapToObject(medication.weeklyAdherence)
      }
    });

  } catch (error: any) {
    console.error('❌ Error marking medication as taken:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark medication as taken",
      error: error.message
    });
  }
};

export const markMedicationMissed = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason, dayDate } = req.body;

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    let missedDate: Date;
    if (dayDate && typeof dayDate === 'string') {
      const parsedDate = new Date(dayDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD format."
        });
      }
      missedDate = parsedDate;
    } else {
      missedDate = new Date();
    }

    const dateKey = missedDate.toISOString().split('T')[0];

    // Update weekly adherence
    if (!medication.weeklyAdherence) {
      medication.weeklyAdherence = new Map();
    }
    
    medication.weeklyAdherence.set(dateKey, {
      taken: false,
      status: 'missed',
      reason: reason || '',
      markedAt: new Date()
    });

    // Update adherence
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'missed',
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'missed';
    }

    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: missedDate,
      status: 'missed',
      reason: reason || ''
    });

    await medication.save();

    res.json({
      success: true,
      message: "Medication marked as missed",
      data: {
        medicationId: medication._id,
        date: dateKey,
        status: 'missed'
      }
    });

  } catch (error: any) {
    console.error('❌ Error marking medication as missed:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark medication as missed",
      error: error.message
    });
  }
};

export const stopMedication = async (req: any, res: any) => {
  try {
    const { medicationId } = req.params;
    const { reason, notes, sideEffectsIntensity } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason for stopping is required"
      });
    }

    await connectMongoDB();

    const medication = await MedicationModel.findOne({
      _id: medicationId,
      patientId: req.userId
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found or you don't have permission to access it"
      });
    }

    // Update medication
    medication.status = 'stopped';
    
    if (!medication.adherence) {
      medication.adherence = {
        currentStatus: 'stopped',
        reasonForStopping: reason,
        stoppedAt: new Date(),
        history: []
      };
    } else {
      medication.adherence.currentStatus = 'stopped';
      medication.adherence.reasonForStopping = reason;
      medication.adherence.stoppedAt = new Date();
    }

    if (!medication.adherence.history) {
      medication.adherence.history = [];
    }

    medication.adherence.history.push({
      date: new Date(),
      status: 'stopped',
      reason: reason,
      notes: notes || ''
    });

    // Update side effects intensity if provided
    if (
      sideEffectsIntensity &&
      medication.experiencedSideEffects &&
      medication.experiencedSideEffects.length > 0
    ) {
      medication.experiencedSideEffects = medication.experiencedSideEffects.map(
        (effect: any) => ({
          ...(effect.toObject ? effect.toObject() : effect),
          intensity: sideEffectsIntensity,
          lastUpdated: new Date()
        })
      );
    }

    await medication.save();

    res.json({
      success: true,
      message: "Medication marked as stopped. Your doctor has been notified.",
      data: {
        medication: medication,
        stoppedInfo: {
          reason: reason,
          notes: notes,
          sideEffectsIntensity: sideEffectsIntensity,
          stoppedAt: new Date()
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error stopping medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to mark medication as stopped",
      error: error.message
    });
  }
};