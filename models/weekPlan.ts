import mongoose, { Schema, Document } from 'mongoose';

export interface IWeekPlan extends Document {
  userId: string;
  dayPlans: Array<{
    day: string;
    workoutId: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const WeekPlanSchema = new Schema<IWeekPlan>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  dayPlans: [{
    day: {
      type: String,
      required: true,
      enum: ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]
    },
    workoutId: {
      type: String,
      default: null
    }
  }]
}, {
  timestamps: true
});

export const WeekPlan = mongoose.models.WeekPlan || mongoose.model<IWeekPlan>('WeekPlan', WeekPlanSchema);
