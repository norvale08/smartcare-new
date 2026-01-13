import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'call' | 'system';
  read: boolean;
  metadata?: {
    callDuration?: number;
    callType?: 'incoming' | 'outgoing' | 'missed';
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'call', 'system'],
      default: 'text',
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

// Index for faster queries
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, createdAt: -1 });
MessageSchema.index({ patientId: 1, createdAt: -1 });

const Message = models.Message || model<IMessage>("Message", MessageSchema);
export default Message;
