import mongoose, { Schema, Document } from 'mongoose';
import type { Exercise as ExerciseType } from '@/types/exercise';
import { SetType } from '@/types/exercise';

export interface IExercise extends ExerciseType, Document {
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    required: function(this: { isSystem: boolean }) {
      return !this.isSystem;  // userId je povinné jen pro uživatelské cviky
    }
  }
}, {
  timestamps: true
});

// Indexy pro rychlejší vyhledávání
ExerciseSchema.index({ userId: 1, isSystem: 1 });
ExerciseSchema.index({ name: 1 });

// Unikátní index pro uživatelské cviky (kombinace jména a userId)
ExerciseSchema.index(
  { name: 1, userId: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isSystem: false }
  }
);

// Unikátní index pro systémové cviky (jen podle jména)
ExerciseSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { isSystem: true }
  }
);

export const ExerciseModel = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
