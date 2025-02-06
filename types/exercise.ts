export enum SetType {
  NORMAL = 'normal',
  DROP = 'drop',
  REST_PAUSE = 'rest_pause'
}

export interface DropSet {
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

export interface Exercise {
  _id?: string;
  name: string;
  category?: string;  
  description?: string;
  isSystem: boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkoutExercise {
  exerciseId: string;        
  isSystem: boolean;
  name: string;         
  sets: ExerciseSet[];      
}
