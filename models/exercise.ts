import mongoose, { Schema, Document } from 'mongoose';

export enum SetType {
  NORMAL = 'normal',
  DROP = 'drop',
  REST_PAUSE = 'rest_pause'
}

interface DropSet {
  weight: number;
  reps: number;
}

export interface ExerciseSet {
  type: SetType;
  weight: number;
  reps: number | 'failure';  
  restPauseSeconds?: number; 
  dropSets?: DropSet[];      
}

export interface IExercise extends Document {
  name: string;
  category?: string;  
  description?: string;
  isSystem: boolean;  
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutExercise {
  exerciseId: string;        
  isSystem: boolean;         
  sets: ExerciseSet[];      
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
    type: Schema.Types.Mixed,  // umožní číslo nebo string 'failure'
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

export const Exercise = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
