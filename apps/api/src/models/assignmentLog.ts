import { Schema, model, Document } from 'mongoose';

interface IAssignmentLog extends Document {
  adminId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  patientId: Schema.Types.ObjectId;
  action: 'assignment' | 'unassignment';
  timestamp: Date;
}

const AssignmentLogSchema = new Schema<IAssignmentLog>({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['assignment', 'unassignment'], required: true },
  timestamp: { type: Date, default: Date.now }
});

export default model<IAssignmentLog>('AssignmentLog', AssignmentLogSchema);