"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { SetType } from '@/types/exercise';
import { workoutStorage, formatWorkoutForStorage } from '@/lib/workoutStorage';
import { toast } from 'sonner';

export const WORKOUT_DEFAULTS = {
  NONE: 'none',
  DEFAULT: 'default',
  NO_WORKOUTS: 'no-workouts'
} as const;

const SAVE_INTERVAL = 2 * 60 * 1000; // 2 minuty

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
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
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
        console.error('Failed to fetch workouts:', response.status);
        setWorkouts([]);
        return;
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
    }
  };

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

  // Automatické ukládání průběhu
  useEffect(() => {
    if (!activeWorkout) return;

    const saveInterval = setInterval(() => {
      if (activeWorkout && Date.now() - lastSaveTime >= SAVE_INTERVAL) {
        saveWorkoutProgress(activeWorkout);
      }
    }, SAVE_INTERVAL);

    return () => clearInterval(saveInterval);
  }, [activeWorkout, lastSaveTime]);

  // Načtení workoutů při přihlášení
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!user) {
        if (isMounted) {
          setWorkouts([]);
          setSelectedWorkout(null);
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

  // Načtení uloženého průběhu při startu
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!user) return;

      try {
        // Nejprve zkusíme načíst z localStorage
        const localWorkout = workoutStorage.load();
        
        if (localWorkout) {
          setActiveWorkout({
            workoutId: localWorkout.workoutId,
            startTime: new Date(localWorkout.startTime),
            exercises: localWorkout.exercises,
            progress: localWorkout.progress
          });
          return;
        }

        // Pokud není v localStorage, zkusíme z databáze
        const token = await user.getIdToken();
        const response = await fetch('/api/workout-progress', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const { data } = await response.json();
          if (data) {
            setActiveWorkout({
              workoutId: data.workoutId,
              startTime: new Date(data.startTime),
              exercises: data.exercises,
              progress: data.progress
            });
            // Uložíme i do localStorage
            workoutStorage.save(data);
          }
        }
      } catch (error) {
        console.error('Error loading saved workout progress:', error);
      }
    };

    loadSavedProgress();
  }, [user]);

  const saveWorkoutProgress = async (workout: ActiveWorkout) => {
    if (!user || !workout) return;

    try {
      const token = await user.getIdToken();
      const workoutData = formatWorkoutForStorage(
        user.uid,
        workout.workoutId,
        workout.startTime,
        workout.exercises,
        workout.progress
      );

      // Uložení do localStorage
      workoutStorage.save(workoutData);

      // Uložení do databáze
      const response = await fetch('/api/workout-progress', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workoutData)
      });

      if (!response.ok) {
        throw new Error('Failed to save workout progress');
      }

      setLastSaveTime(Date.now());
      console.log('Workout progress saved successfully');
    } catch (error) {
      console.error('Error saving workout progress:', error);
    }
  };

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
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        return;
      }

      const result = await response.json();

      if (!result._id) {
        console.error('Invalid server response - missing required fields:', result);
        return;
      }

      const newWorkout = {
        ...result,
        name: result.name || workoutData.name
      };

      setWorkouts(prevWorkouts => [...prevWorkouts, newWorkout]);
    } catch (error) {
      console.error('Error adding workout:', error);
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
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        return;
      }

      await fetchWorkouts();
      
      if (selectedWorkout?._id === id) {
        const updatedWorkout = await response.json();
        setSelectedWorkout(updatedWorkout);
      }
    } catch (error) {
      console.error('Error updating workout:', error);
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
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        return;
      }

      if (selectedWorkout?._id === id) {
        setSelectedWorkout(null);
      }

      await fetchWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
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
      const token = await user.getIdToken();
      // Uložíme do databáze
      const response = await fetch('/api/workout-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formatWorkoutForStorage(
          user.uid,
          workoutId,
          newActiveWorkout.startTime,
          newActiveWorkout.exercises,
          newActiveWorkout.progress
        ))
      });

      if (!response.ok) {
        throw new Error('Failed to save initial workout progress');
      }

      // Uložíme do localStorage
      workoutStorage.save(formatWorkoutForStorage(
        user.uid,
        workoutId,
        newActiveWorkout.startTime,
        newActiveWorkout.exercises,
        newActiveWorkout.progress
      ));

      setActiveWorkout(newActiveWorkout);
      setLastSaveTime(Date.now());
    } catch (error) {
      console.error('Error starting workout:', error);
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

      // Okamžitě uložíme změnu
      saveWorkoutProgress(newWorkout);

      return newWorkout;
    });
  };

  const endWorkout = async () => {
    if (!activeWorkout || !user) return;

    const endToast = toast.loading('Ukládám trénink...');

    try {
      const token = await user.getIdToken();
    
      // Nejdřív označíme workout jako neaktivní v workout-progress
      const progressResponse = await fetch('/api/workout-progress', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workoutId: activeWorkout.workoutId,
          exercises: activeWorkout.exercises,
          progress: activeWorkout.progress,
          isActive: false
        })
      });

      if (!progressResponse.ok) {
        throw new Error('Nepodařilo se uložit průběh tréninku');
      }

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

      toast.success('Trénink byl úspěšně uložen', {
        id: endToast,
        description: `Dokončeno ${activeWorkout.exercises.reduce(
          (total, ex) => total + ex.sets.filter(s => s.isCompleted).length, 0
        )} sérií | ${Math.round(activeWorkout.progress)}% tréninku`
      });
    } catch (error) {
      console.error('Failed to end workout:', error);
      toast.error('Chyba při ukládání tréninku', {
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
