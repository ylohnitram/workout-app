import { IWorkoutProgress } from '@/models/workoutProgress';

const STORAGE_KEY = 'activeWorkout';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hodin

interface StoredWorkout extends IWorkoutProgress {
  timestamp: number;
}

export const workoutStorage = {
  // Uložení průběhu tréninku do localStorage
  save: (workout: IWorkoutProgress) => {
    try {
      const data: StoredWorkout = {
        ...workout,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving workout to localStorage:', error);
      return false;
    }
  },

  // Načtení průběhu tréninku z localStorage
  load: (): IWorkoutProgress | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const stored: StoredWorkout = JSON.parse(data);

      // Kontrola expirace
      if (Date.now() - stored.timestamp > STORAGE_EXPIRY) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Převedeme timestamp zpět na Date objekty
      const workout: IWorkoutProgress = {
        ...stored,
        startTime: new Date(stored.startTime),
        lastSaveTime: new Date(stored.lastSaveTime),
        exercises: stored.exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets.map(set => ({
            ...set,
            completedAt: set.completedAt ? new Date(set.completedAt) : undefined
          }))
        }))
      };

      return workout;
    } catch (error) {
      console.error('Error loading workout from localStorage:', error);
      return null;
    }
  },

  // Vymazání průběhu tréninku z localStorage
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing workout from localStorage:', error);
      return false;
    }
  },

  // Kontrola, zda existuje uložený trénink
  exists: (): boolean => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return false;

      const stored: StoredWorkout = JSON.parse(data);
      // Kontrola expirace
      if (Date.now() - stored.timestamp > STORAGE_EXPIRY) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
};

// Pomocná funkce pro převod aktivního workoutu na formát pro uložení
export const formatWorkoutForStorage = (
  userId: string,
  workoutId: string,
  startTime: Date,
  exercises: any[],
  progress: number
): IWorkoutProgress => ({
  userId,
  workoutId,
  startTime,
  lastSaveTime: new Date(),
  isActive: true,
  exercises: exercises.map(exercise => ({
    exerciseId: exercise.exerciseId,
    isSystem: exercise.isSystem,
    name: exercise.name,
    sets: exercise.sets.map((set: any) => ({
      ...set,
      completedAt: set.isCompleted ? new Date() : undefined
    })),
    progress: exercise.progress
  })),
  progress
});
