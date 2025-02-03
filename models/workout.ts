import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkout extends Document {
  userId: string;
  date: Date;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
    }>;
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
    sets: [{
      weight: {
        type: Number,
        required: true
      },
      reps: {
        type: Number,
        required: true
      }
    }]
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Předejít chybě při hot-reloadu v development módu
export const Workout = mongoose.models.Workout || mongoose.model<IWorkout>('Workout', WorkoutSchema); 