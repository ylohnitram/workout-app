"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { SetType } from '@/types/exercise';
import { workoutStorage } from '@/lib/workoutStorage';
import { toast } from 'sonner';

export const WORKOUT_DEFAULTS = {
  NONE: 'none',
  DEFAULT: 'default',
  NO_WORKOUTS: 'no-workouts'
} as const;

// Základní typy pro cvičení
interface DropSet {
  weight: number;
  reps: number;
}

interface ExerciseSet {
  type: SetType;
  weight: number;
  reps: number | 'failure';
  restPauseSeconds?: number;
  dropSets?: DropSet[];
}

interface WorkoutExercise {
  exerciseId: string;
  isSystem: boolean;
  name: string;
  sets: ExerciseSet[];
}

export interface Workout {
  _id?: string;
  name: string;
  exercises: WorkoutExercise[];
  date?: Date;
}

// Typy pro aktivní tracking workoutu
interface ActiveWorkoutSet extends ExerciseSet {
  isCompleted: boolean;
  actualWeight?: number;
  actualReps?: number;
  completedAt?: Date;
}

interface ActiveWorkoutExercise extends Omit<WorkoutExercise, 'sets'> {
  sets: ActiveWorkoutSet[];
  progress: number;
}

interface ActiveWorkout {
  workoutId: string;
  startTime: Date;
  exercises: ActiveWorkoutExercise[];
  progress: number;
}

interface WorkoutContextType {
  workouts: Workout[];
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (id: string, workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  selectedWorkout: Workout | null;
  setSelectedWorkout: (workout: Workout | null) => void;
  activeWorkout: ActiveWorkout | null;
  startWorkout: (workoutId: string) => void;
  completeSet: (exerciseIndex: number, setIndex: number, performance?: {
    weight?: number;
    reps?: number;
  }) => void;
  endWorkout: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState<number>(0);
  const { user } = useAuth();

  const fetchWorkouts = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/workouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }

      const result = await response.json();
      const workoutsData = result.data || [];
      if (Array.isArray(workoutsData)) {
        const processedWorkouts = workoutsData.map(workout => ({
          ...workout,
          _id: workout._id || workout.id,
          name: workout.name || 'Unnamed workout',
          exercises: Array.isArray(workout.exercises) ? workout.exercises.map(exercise => ({
            ...exercise,
            sets: Array.isArray(exercise.sets) ? exercise.sets.map(set => ({
              ...set,
              dropSets: Array.isArray(set.dropSets) ? set.dropSets : []
            })) : []
          })) : []
        }));
        
        setWorkouts(processedWorkouts);
      } else {
        console.error('Unexpected data format:', result);
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setWorkouts([]);
      toast.error('Nepodařilo se načíst tréninky');
    }
  };

  // Načtení uloženého průběhu při startu - NIKDY automaticky nespouštět
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!user) {
        setActiveWorkout(null);
        workoutStorage.clear();
        return;
      }

      try {
        // Pouze kontrolujeme, zda existuje uložený průběh, ale NENASTAVUJEME ho automaticky
        const localWorkout = workoutStorage.load();
        if (localWorkout) {
          console.log('Found saved workout, but not auto-starting it');
          workoutStorage.clear(); // Vyčistíme localStorage
        }

        // Vyčistíme případný aktivní trénink v MongoDB
        const token = await user.getIdToken();
        await fetch('/api/workout-progress', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error checking saved workout progress:', error);
      }
    };

    loadSavedProgress();
  }, [user]);

  // Timer effect pro aktivní workout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeWorkout) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeWorkout.startTime.getTime()) / 1000);
        setWorkoutTimer(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeWorkout]);

  // Načtení workoutů při přihlášení
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!user) {
        if (isMounted) {
          setWorkouts([]);
          setSelectedWorkout(null);
          setActiveWorkout(null);  // Reset aktivního workoutu při odhlášení
          workoutStorage.clear();   // Vyčištění localStorage při odhlášení
        }
        return;
      }

      if (isMounted) {
        await fetchWorkouts();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const addWorkout = async (workout: Workout) => {
    if (!user) return;
    
    if (!workout.name || workout.name === WORKOUT_DEFAULTS.DEFAULT) {
      console.error('Invalid workout name:', workout.name);
      return;
    }

    try {
      const token = await user.getIdToken();
      const workoutData = {
        name: workout.name.trim(),
        exercises: workout.exercises || []
      };
      
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) {
        throw new Error('Failed to add workout');
      }

      const result = await response.json();
      setWorkouts(prevWorkouts => [...prevWorkouts, result]);
      toast.success('Trénink byl vytvořen');
    } catch (error) {
      console.error('Error adding workout:', error);
      toast.error('Nepodařilo se vytvořit trénink');
    }
  };

  const updateWorkout = async (id: string, workout: Workout) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const workoutData = {
        ...workout,
        name: workout.name.trim()
      };
      
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) {
        throw new Error('Failed to update workout');
      }

      await fetchWorkouts();
      
      if (selectedWorkout?._id === id) {
        const updatedWorkout = await response.json();
        setSelectedWorkout(updatedWorkout);
      }
      toast.success('Trénink byl aktualizován');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Nepodařilo se aktualizovat trénink');
    }
  };

  const deleteWorkout = async (id: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      if (selectedWorkout?._id === id) {
        setSelectedWorkout(null);
      }

      setWorkouts(prevWorkouts => prevWorkouts.filter(w => w._id !== id));
      toast.success('Trénink byl smazán');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Nepodařilo se smazat trénink');
    }
  };

  const startWorkout = async (workoutId: string) => {
    if (!user) return;

    const workout = workouts.find(w => w._id === workoutId);
    if (!workout) return;

    const newActiveWorkout: ActiveWorkout = {
      workoutId,
      startTime: new Date(),
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          isCompleted: false
        })),
        progress: 0
      })),
      progress: 0
    };

    try {
      setActiveWorkout(newActiveWorkout);
      toast.success('Trénink byl zahájen');
    } catch (error) {
      console.error('Error starting workout:', error);
      toast.error('Nepodařilo se zahájit trénink');
    }
  };

  const completeSet = (exerciseIndex: number, setIndex: number, performance?: {
    weight?: number;
    reps?: number;
  }) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;

      const newExercises = [...prev.exercises];
      const exercise = newExercises[exerciseIndex];
      
      if (!exercise) return prev;

      exercise.sets[setIndex] = {
        ...exercise.sets[setIndex],
        isCompleted: true,
        actualWeight: performance?.weight,
        actualReps: performance?.reps,
        completedAt: new Date()
      };

      const completedSets = exercise.sets.filter(s => s.isCompleted).length;
      exercise.progress = (completedSets / exercise.sets.length) * 100;

      const totalSets = newExercises.reduce((total, ex) => total + ex.sets.length, 0);
      const totalCompletedSets = newExercises.reduce((total, ex) => 
        total + ex.sets.filter(s => s.isCompleted).length, 0);
      
      const newWorkout = {
        ...prev,
        exercises: newExercises,
        progress: (totalCompletedSets / totalSets) * 100
      };

      return newWorkout;
    });
  };

  const endWorkout = async () => {
    if (!activeWorkout || !user) return;

    const endToast = toast.loading('Ukončuji trénink...');

    try {
      const token = await user.getIdToken();
      
      // Vytvoříme log dokončeného tréninku
      const logResponse = await fetch('/api/workout-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workoutId: activeWorkout.workoutId,
          startTime: activeWorkout.startTime,
          endTime: new Date(),
          duration: workoutTimer,
          exercises: activeWorkout.exercises.map(exercise => ({
            exerciseId: exercise.exerciseId,
            isSystem: exercise.isSystem,
            name: exercise.name,
            sets: exercise.sets.map(set => ({
              ...set,
              completedAt: set.completedAt || new Date()
            })),
            progress: exercise.progress
          }))
        })
      });

      if (!logResponse.ok) {
        const errorData = await logResponse.json();
        throw new Error(errorData.error || 'Nepodařilo se uložit záznam tréninku');
      }

      // Vyčistíme localStorage
      workoutStorage.clear();

      setActiveWorkout(null);
      setWorkoutTimer(0);

      toast.success('Trénink byl úspěšně ukončen', {
        id: endToast,
        description: `Dokončeno ${activeWorkout.exercises.reduce(
          (total, ex) => total + ex.sets.filter(s => s.isCompleted).length, 0
        )} sérií | ${Math.round(activeWorkout.progress)}% tréninku`
      });
    } catch (error) {
      console.error('Failed to end workout:', error);
      toast.error('Chyba při ukončování tréninku', {
        id: endToast,
        description: error instanceof Error ? error.message : 'Neznámá chyba'
      });
    }
  };

  const value = {
    workouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    selectedWorkout,
    setSelectedWorkout,
    activeWorkout,
    startWorkout,
    completeSet,
    endWorkout
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}

export const isEmptyValue = (value: string) =>
  !value || value === WORKOUT_DEFAULTS.NONE || value === WORKOUT_DEFAULTS.DEFAULT;

export const getDisplayValue = (value: string) =>
  isEmptyValue(value) ? '' : value;

export const getSafeValue = (value: string) =>
  value || WORKOUT_DEFAULTS.DEFAULT;
