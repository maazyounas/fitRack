import { Schema, model } from 'mongoose';

const encryptedFieldSchema = new Schema(
  {
    iv: { type: String, required: true },
    content: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { _id: false }
);

const pendingRegistrationSchema = new Schema(
  {
    emailEncrypted: encryptedFieldSchema,
    emailHash: { type: String, unique: true, sparse: true, index: true },
    phoneEncrypted: encryptedFieldSchema,
    phoneHash: { type: String, unique: true, sparse: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingRegistrationModel = model('PendingRegistration', pendingRegistrationSchema);
