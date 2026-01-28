import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalToken extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalTokenSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  used: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for faster queries
ApprovalTokenSchema.index({ email: 1, token: 1 });
ApprovalTokenSchema.index({ used: 1 });

// Auto-delete expired tokens after 7 days
ApprovalTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent model overwrite
const ApprovalToken = mongoose.models.ApprovalToken || 
  mongoose.model<IApprovalToken>('ApprovalToken', ApprovalTokenSchema);

export default ApprovalToken;