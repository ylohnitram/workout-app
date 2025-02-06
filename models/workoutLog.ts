import mongoose from 'mongoose';
import { SetType } from '@/types/exercise';

// Schema pro drop set v logu
const LogDropSetSchema = new mongoose.Schema({
  weight: { type: Number, required: true },
  reps: { type: Number }
}, { _id: false });

// Schema pro set v logu
const LogSetSchema = new mongoose.Schema({
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
  dropSets: [LogDropSetSchema],
  isCompleted: { type: Boolean, default: false },
  actualWeight: { type: Number },
  actualReps: { type: Number },
  completedAt: { type: Date }
}, { _id: false });

// Schema pro cvik v logu
const LogExerciseSchema = new mongoose.Schema({
  exerciseId: { type: String, required: true },
  isSystem: { type: Boolean, required: true },
  name: { type: String, required: true },
  sets: [LogSetSchema],
  progress: { type: Number, required: true }
}, { _id: false });

// Hlavní schema pro log tréninku
const WorkoutLogSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true  // index pro rychlé vyhledávání podle uživatele
  },
  workoutId: { 
    type: String, 
    required: true,
    index: true  // index pro rychlé vyhledávání podle workoutu
  },
  startTime: { 
    type: Date, 
    required: true,
    index: true  // index pro rychlé vyhledávání podle času
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number,  // v sekundách
    required: true 
  },
  exercises: [LogExerciseSchema],
  totalProgress: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  totalSets: {
    type: Number,
    required: true
  },
  completedSets: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Middleware pro automatický výpočet statistik před uložením
WorkoutLogSchema.pre('save', function(next) {
  if (this.isModified('exercises')) {
    let totalSets = 0;
    let completedSets = 0;

    this.exercises.forEach(exercise => {
      totalSets += exercise.sets.length;
      completedSets += exercise.sets.filter(set => set.isCompleted).length;
    });

    this.totalSets = totalSets;
    this.completedSets = completedSets;
    this.totalProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }
  next();
});

// Indexy pro častá vyhledávání
WorkoutLogSchema.index({ userId: 1, startTime: -1 });
WorkoutLogSchema.index({ workoutId: 1, startTime: -1 });

// Pomocné statické metody
WorkoutLogSchema.statics.findUserLogs = function(userId: string, limit = 10) {
  return this.find({ userId })
    .sort({ startTime: -1 })
    .limit(limit);
};

WorkoutLogSchema.statics.findWorkoutLogs = function(workoutId: string, limit = 10) {
  return this.find({ workoutId })
    .sort({ startTime: -1 })
    .limit(limit);
};

WorkoutLogSchema.statics.findDateRangeLogs = function(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    startTime: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ startTime: -1 });
};

// Typy pro TypeScript
export interface IWorkoutLog {
  userId: string;
  workoutId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  exercises: {
    exerciseId: string;
    isSystem: boolean;
    name: string;
    sets: {
      type: SetType;
      weight: number;
      reps: number | 'failure';
      restPauseSeconds?: number;
      dropSets?: { weight: number; reps?: number }[];
      isCompleted: boolean;
      actualWeight?: number;
      actualReps?: number;
      completedAt?: Date;
    }[];
    progress: number;
  }[];
  totalProgress: number;
  totalSets: number;
  completedSets: number;
}

// Export modelu (nebo jeho vytvoření, pokud ještě neexistuje)
export const WorkoutLog = mongoose.models.WorkoutLog ||
  mongoose.model<IWorkoutLog>('WorkoutLog', WorkoutLogSchema);
