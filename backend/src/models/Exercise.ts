import { Schema, model } from 'mongoose';

const demoVideoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ratingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userNoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '', trim: true, maxlength: 2000 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: '', trim: true },
    muscleGroup: { type: String, required: true, trim: true, index: true },
    targetMuscles: { type: [String], default: [], index: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
      index: true,
    },
    equipment: { type: String, default: 'Bodyweight', trim: true, index: true },
    instructions: { type: [String], default: [] },
    demoVideos: { type: [demoVideoSchema], default: [] },
    ratings: { type: [ratingSchema], default: [] },
    comments: { type: [commentSchema], default: [] },
    favoriteUserIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    userNotes: { type: [userNoteSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ExerciseModel = model('Exercise', exerciseSchema);
