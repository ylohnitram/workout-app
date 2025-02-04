import mongoose, { Schema, Document } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  category?: string;  // např. "nohy", "záda", "ruce" atd.
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export const Exercise = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
