import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 280 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const socialPostSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    likeUserIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    comments: { type: [commentSchema], default: [] },
    challengeId: { type: Schema.Types.ObjectId, ref: 'WeeklyChallenge', default: null },
    imageUrl: { type: String, default: null },
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SocialPostModel = model('SocialPost', socialPostSchema);
