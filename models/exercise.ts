import mongoose, { Schema, Document } from 'mongoose';
import type { Exercise as ExerciseType } from '@/types/exercise';
import { SetType } from '@/types/exercise';

export interface IExercise extends ExerciseType, Document {
  userId?: string;  // Pro identifikaci vlastníka cviku
  createdAt: Date;
  updatedAt: Date;
}

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
    required: true
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
  },
  userId: {
    type: String,
    required: function() {
      return !this.isSystem;  // userId je povinný pouze pro uživatelské cviky
    },
    index: true
  }
}, {
  timestamps: true
});

// Index pro rychlejší vyhledávání
ExerciseSchema.index({ userId: 1, isSystem: 1 });
ExerciseSchema.index({ name: 1 });

// Unikátní index pro kombinaci jména a userId (nebo isSystem)
ExerciseSchema.index(
  { name: 1, userId: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isSystem: false }  // Aplikuje se jen na uživatelské cviky
  }
);

ExerciseSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { isSystem: true }  // Aplikuje se jen na systémové cviky
  }
);

export const ExerciseModel = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
