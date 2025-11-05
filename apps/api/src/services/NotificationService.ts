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
      console.error("❌ Error creating notification:", error);
      throw error;
    }
  }

  // Generate vital alerts based on vitals data
  static async checkVitalAlerts(vitalData: any, userId: string, patientId?: string) {
    const alerts = [];

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
      await this.createNotification({
        userId,
        ...alert,
        patientId,
        vitalId: vitalData._id?.toString(),
        metadata: vitalData,
      });
    }

    return alerts;
  }
}