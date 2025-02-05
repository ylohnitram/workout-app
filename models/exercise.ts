import mongoose, { Schema, Document } from 'mongoose';
import type { Exercise as ExerciseType } from '@/types/exercise';
import { SetType } from '@/types/exercise';

export interface IExercise extends ExerciseType, Document {}

const DropSetSchema = new Schema({
  weight: {
    type: Number,
    required: true
  },
  reps: {
    type: Number,
    required: true
  }
});

const ExerciseSetSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(SetType),
    required: true,
    default: SetType.NORMAL
  },
  weight: {
    type: Number,
    required: true
  },
  reps: {
    type: Schema.Types.Mixed,
    required: true
  },
  restPauseSeconds: {
    type: Number,
    required: false
  },
  dropSets: {
    type: [DropSetSchema],
    required: false
  }
});

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
  },
  isSystem: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
});

export const ExerciseModel = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
