"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { SetType } from '@/types/exercise';

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
  // Základní funkce pro správu workoutů
  workouts: Workout[];
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (id: string, workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  selectedWorkout: Workout | null;
  setSelectedWorkout: (workout: Workout | null) => void;
  
  // Funkce pro tracking workoutu
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
      console.log('Raw API response:', result);

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
        
        console.log('Processed workouts:', processedWorkouts);
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
      
      console.log('Sending workout:', JSON.stringify(workoutData, null, 2));

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
      console.log('Server response:', JSON.stringify(result, null, 2));

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
      
      console.log('Updating workout:', JSON.stringify(workoutData, null, 2));
      
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
      
      // Aktualizujeme selectedWorkout, pokud byl upravován
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

  // Funkce pro tracking workoutu
  const startWorkout = (workoutId: string) => {
    const workout = workouts.find(w => w._id === workoutId);
    if (!workout) return;

    const activeWorkoutExercises: ActiveWorkoutExercise[] = workout.exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        isCompleted: false
      })),
      progress: 0
    }));

    setActiveWorkout({
      workoutId,
      startTime: new Date(),
      exercises: activeWorkoutExercises,
      progress: 0
    });
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

      // Označit sérii jako dokončenou
      exercise.sets[setIndex] = {
        ...exercise.sets[setIndex],
        isCompleted: true,
        actualWeight: performance?.weight,
        actualReps: performance?.reps
      };

      // Přepočítat progress cviku
      const completedSets = exercise.sets.filter(s => s.isCompleted).length;
      exercise.progress = (completedSets / exercise.sets.length) * 100;

      // Přepočítat celkový progress
      const totalSets = newExercises.reduce((total, ex) => total + ex.sets.length, 0);
      const totalCompletedSets = newExercises.reduce((total, ex) => 
        total + ex.sets.filter(s => s.isCompleted).length, 0);
      
      return {
        ...prev,
        exercises: newExercises,
        progress: (totalCompletedSets / totalSets) * 100
      };
    });
  };

  const endWorkout = async () => {
    if (!activeWorkout || !user) return;

    try {
      const token = await user.getIdToken();
      await fetch('/api/workout-logs', {
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
          exercises: activeWorkout.exercises
        })
      });

      setActiveWorkout(null);
      setWorkoutTimer(0);
    } catch (error) {
      console.error('Failed to save workout log:', error);
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
