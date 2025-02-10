import { ActiveWorkout } from '@/contexts/WorkoutContext';

const STORAGE_KEY = 'activeWorkout';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hodin

interface StoredWorkout extends ActiveWorkout {
  timestamp: number;
  version: number;
}

export const workoutStorage = {
  // Uložení průběhu tréninku do localStorage
  save: (workout: ActiveWorkout) => {
    try {
      const data: StoredWorkout = {
        ...workout,
        timestamp: Date.now(),
        version: 1  // Verze pro kontrolu konzistence
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving workout to localStorage:', error);
      return false;
    }
  },

  // Načtení průběhu tréninku z localStorage
  load: (): ActiveWorkout | null => {
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
      const workout: ActiveWorkout = {
        ...stored,
        startTime: new Date(stored.startTime),
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
