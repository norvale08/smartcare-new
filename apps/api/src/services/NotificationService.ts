// apps/api/src/services/notificationService.ts
import Notification from "../models/notifications";
import Patient from "../models/patient";
import User from "../models/user";

interface CreateNotificationParams {
  userId: string;
  type: 'vital_alert' | 'message' | 'call' | 'system' | 'appointment';
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  vitalId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    try {
      // If patientId is provided but patientName isn't, try to get patient name
      let patientName = params.patientName;
      if (params.patientId && !patientName) {
        const patient = await Patient.findOne({ userId: params.patientId });
        if (patient) {
          patientName = patient.fullName || `${patient.firstname} ${patient.lastname}`;
        } else {
          // Fallback to User model
          const user = await User.findById(params.patientId);
          if (user) {
            patientName = user.fullName || `${user.firstname} ${user.lastname}`;
          }
        }
      }

      const notification = new Notification({
        ...params,
        patientName,
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error(" Error creating notification:", error);
      throw error;
    }
  }

  // Generate vital alerts based on vitals data
  static async checkVitalAlerts(vitalData: any, userId: string, patientId?: string) {
    const alerts = [];
    let patientName = '';

    // Get patient name
    try {
      const patient = await Patient.findOne({ userId });
      if (patient) {
        patientName = patient.fullName || `${patient.firstname} ${patient.lastname}`;
      } else {
        const user = await User.findById(userId);
        if (user) {
          patientName = user.fullName || `${user.firstname} ${user.lastname}`;
        }
      }
    } catch (error) {
      console.error('Error fetching patient name:', error);
    }

    // Check blood pressure for hypertension
    if (vitalData.systolic && vitalData.diastolic) {
      if (vitalData.systolic >= 180 || vitalData.diastolic >= 120) {
        alerts.push({
          type: 'vital_alert' as const,
          title: 'Critical Blood Pressure',
          message: `Blood pressure critically high: ${vitalData.systolic}/${vitalData.diastolic} mmHg`,
          priority: 'critical' as const,
        });
      } else if (vitalData.systolic >= 140 || vitalData.diastolic >= 90) {
        alerts.push({
          type: 'vital_alert' as const,
          title: 'High Blood Pressure',
          message: `Blood pressure elevated: ${vitalData.systolic}/${vitalData.diastolic} mmHg`,
          priority: 'high' as const,
        });
      }
    }

    // Check glucose for diabetes
    if (vitalData.glucose) {
      if (vitalData.glucose >= 300) {
        alerts.push({
          type: 'vital_alert' as const,
          title: 'Critical Glucose Level',
          message: `Glucose critically high: ${vitalData.glucose} mg/dL`,
          priority: 'critical' as const,
        });
      } else if (vitalData.glucose >= 180) {
        alerts.push({
          type: 'vital_alert' as const,
          title: 'High Glucose Level',
          message: `Glucose elevated: ${vitalData.glucose} mg/dL`,
          priority: 'high' as const,
        });
      } else if (vitalData.glucose <= 70) {
        alerts.push({
          type: 'vital_alert' as const,
          title: 'Low Glucose Level',
          message: `Glucose low: ${vitalData.glucose} mg/dL`,
          priority: 'high' as const,
        });
      }
    }

    // Check heart rate
    if (vitalData.heartRate) {
      if (vitalData.heartRate >= 120 || vitalData.heartRate <= 50) {
        alerts.push({
          type: 'vital_alert' as const,
          title: 'Abnormal Heart Rate',
          message: `Heart rate outside normal range: ${vitalData.heartRate} bpm`,
          priority: 'medium' as const,
        });
      }
    }

    // Create notifications for each alert
    for (const alert of alerts) {
      // Notify the patient
      await this.createNotification({
        userId,
        ...alert,
        patientId: patientId || userId,
        patientName,
        vitalId: vitalData._id?.toString(),
        metadata: vitalData,
      });

      // If critical, also notify assigned doctors
      if (alert.priority === 'critical' || alert.priority === 'high') {
        try {
          // Find all doctors assigned to this patient
          const doctors = await User.find({
            role: 'doctor',
            assignedPatients: patientId || userId
          });

          // Create notification for each assigned doctor
          for (const doctor of doctors) {
            await this.createNotification({
              userId: doctor._id.toString(),
              ...alert,
              patientId: patientId || userId,
              patientName,
              vitalId: vitalData._id?.toString(),
              metadata: vitalData,
            });
          }


        } catch (error) {
          console.error('Error notifying doctors:', error);
        }

        // 3. Notify relatives (users who monitor this patient)
        try {
          // CRITICAL FIX: The patient's User ID is what relatives have stored in monitoredPatient
          // userId parameter = patient's User ID from User collection
          // This is what we need to query against monitoredPatient field
          const patientUserId = userId; // This is already the correct patient User ID
          
          console.log(`🔍 Searching for relatives monitoring patient User ID: ${patientUserId}`);
          
          // Find all relatives who are monitoring this patient by their User ID
          const relatives = await User.find({
            role: 'relative',
            monitoredPatient: patientUserId // Match against patient's User ID
          });

          console.log(`✅ Found ${relatives.length} relatives monitoring patient ${patientUserId}`);
          
          if (relatives.length > 0) {
            console.log(`📋 Relative details:`, relatives.map(r => ({
              id: r._id.toString(),
              email: r.email,
              monitoredPatient: r.monitoredPatient?.toString()
            })));
          }

          for (const relative of relatives) {
            console.log(`📤 Creating notification for relative ${relative._id} (${relative.email})`);
            await this.createNotification({
              userId: relative._id.toString(), // Relative's own User ID (where notification is stored)
              ...alert,
              patientId: patientUserId, // Patient's User ID (for querying/filtering)
              patientName,
              vitalId: vitalData._id?.toString(),
              metadata: vitalData,
            });
            console.log(`✅ Notification created for relative ${relative._id}`);
          }
        } catch (error) {
          console.error('❌ Error notifying relatives:', error);
          console.error('❌ Error details:', error);
        }
      }
    }

    return alerts;
  }
}