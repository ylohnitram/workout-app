import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkout extends Document {
  userId: string;
  name: string;
  date: Date;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSchema = new Schema<IWorkout>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  exercises: [{
    name: {
      type: String,
      required: true
    },
    sets: {
      type: Number,
      required: true,
      min: 0
    },
    reps: {
      type: Number,
      required: true,
      min: 0
    },
    weight: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export const Workout = mongoose.models.Workout || mongoose.model<IWorkout>('Workout', WorkoutSchema);
