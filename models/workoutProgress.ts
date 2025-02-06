import mongoose from 'mongoose';
import { SetType } from '@/types/exercise';

// Schema pro drop set
const DropSetSchema = new mongoose.Schema({
  weight: { type: Number, required: true },
  reps: { type: Number }
}, { _id: false });

// Schema pro set v průběhu cvičení
const ActiveSetSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: Object.values(SetType),
    required: true 
  },
  weight: { type: Number, required: true },
  reps: { 
    type: mongoose.Schema.Types.Mixed,  // může být číslo nebo 'failure'
    required: true 
  },
  restPauseSeconds: { type: Number },
  dropSets: [DropSetSchema],
  isCompleted: { type: Boolean, default: false },
  actualWeight: { type: Number },
  actualReps: { type: Number },
  completedAt: { type: Date }
}, { _id: false });

// Schema pro cvik v průběhu
const ActiveExerciseSchema = new mongoose.Schema({
  exerciseId: { type: String, required: true },
  isSystem: { type: Boolean, required: true },
  name: { type: String, required: true },
  sets: [ActiveSetSchema],
  progress: { type: Number, default: 0 }
}, { _id: false });

// Hlavní schema pro průběh tréninku
const WorkoutProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  workoutId: { type: String, required: true },
  startTime: { type: Date, required: true },
  lastSaveTime: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  exercises: [ActiveExerciseSchema],
  progress: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index pro rychlé vyhledávání aktivních tréninků uživatele
WorkoutProgressSchema.index({ userId: 1, isActive: 1 });

// Pomocné metody
WorkoutProgressSchema.statics.findActiveByUserId = function(userId: string) {
  return this.findOne({ userId, isActive: true });
};

WorkoutProgressSchema.statics.deactivateAll = function(userId: string) {
  return this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );
};

// Export modelu (nebo jeho vytvoření, pokud ještě neexistuje)
export const WorkoutProgress = mongoose.models.WorkoutProgress || 
  mongoose.model('WorkoutProgress', WorkoutProgressSchema);

// Typy pro TypeScript
export interface IWorkoutProgress {
  userId: string;
  workoutId: string;
  startTime: Date;
  lastSaveTime: Date;
  isActive: boolean;
  exercises: {
    exerciseId: string;
    isSystem: boolean;
    name: string;
    sets: {
      type: SetType;
      weight: number;
      reps: number | 'failure';
      restPauseSeconds?: number;
      dropSets?: { weight: number; reps?: number; }[];
      isCompleted: boolean;
      actualWeight?: number;
      actualReps?: number;
      completedAt?: Date;
    }[];
    progress: number;
  }[];
  progress: number;
}
