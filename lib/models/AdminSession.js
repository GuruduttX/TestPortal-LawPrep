import mongoose from 'mongoose';

const AdminSessionSchema = new mongoose.Schema(
  {
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AdminSessionSchema.index({ username: 1, revokedAt: 1, expiresAt: 1 });

export default mongoose.models.AdminSession || mongoose.model('AdminSession', AdminSessionSchema);
