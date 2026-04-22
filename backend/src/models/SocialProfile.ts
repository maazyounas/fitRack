import { Schema, model } from 'mongoose';

const socialProfileSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    followingIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    followerIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    bio: { type: String, default: '', trim: true, maxlength: 180 },
  },
  { timestamps: true }
);

export const SocialProfileModel = model('SocialProfile', socialProfileSchema);
