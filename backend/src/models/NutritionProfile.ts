import { Schema, model } from 'mongoose';

const nutrientTotalsSchema = new Schema(
  {
    calories: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fats: { type: Number, default: 0, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    sodium: { type: Number, default: 0, min: 0 },
    potassium: { type: Number, default: 0, min: 0 },
    calcium: { type: Number, default: 0, min: 0 },
    iron: { type: Number, default: 0, min: 0 },
    vitaminC: { type: Number, default: 0, min: 0 },
    vitaminD: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const foodItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'serving', trim: true },
    nutrients: { type: nutrientTotalsSchema, default: () => ({}) },
  },
  { _id: true }
);

const mealEntrySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      default: 'snack',
    },
    consumedAt: { type: Date, required: true },
    notes: { type: String, default: '' },
    foods: { type: [foodItemSchema], default: [] },
    totals: { type: nutrientTotalsSchema, default: () => ({}) },
  },
  { _id: true }
);

const waterLogSchema = new Schema(
  {
    amountMl: { type: Number, required: true, min: 1, max: 5000 },
    loggedAt: { type: Date, required: true },
  },
  { _id: true }
);

const nutritionGoalsSchema = new Schema(
  {
    calories: { type: Number, default: 2200, min: 1000 },
    protein: { type: Number, default: 140, min: 0 },
    carbs: { type: Number, default: 220, min: 0 },
    fats: { type: Number, default: 70, min: 0 },
    fiber: { type: Number, default: 30, min: 0 },
    waterMl: { type: Number, default: 2500, min: 250 },
  },
  { _id: false }
);

const hydrationReminderSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    intervalMinutes: { type: Number, default: 120, min: 30, max: 360 },
    startHour: { type: Number, default: 8, min: 0, max: 23 },
    endHour: { type: Number, default: 21, min: 0, max: 23 },
  },
  { _id: false }
);

const aiSuggestionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['meal', 'diet', 'recipe', 'hydration'],
      required: true,
    },
  },
  { _id: false }
);

const nutritionProfileSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    goals: { type: nutritionGoalsSchema, default: () => ({}) },
    hydrationReminder: { type: hydrationReminderSchema, default: () => ({}) },
    meals: { type: [mealEntrySchema], default: [] },
    waterLogs: { type: [waterLogSchema], default: [] },
    aiSuggestions: { type: [aiSuggestionSchema], default: [] },
  },
  { timestamps: true }
);

export const NutritionProfileModel = model('NutritionProfile', nutritionProfileSchema);
