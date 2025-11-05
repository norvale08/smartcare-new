// apps/api/src/models/Notification.ts
import mongoose, { Schema, Document, model, models } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'vital_alert' | 'message' | 'call' | 'system' | 'appointment';
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  vitalId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ['vital_alert', 'message', 'call', 'system', 'appointment'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    patientId: {
      type: String,
    },
    patientName: {
      type: String,
    },
    vitalId: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);
export default Notification;