"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Definujeme konstanty pro speciální hodnoty
export const WORKOUT_DEFAULTS = {
  NONE: 'none',
  DEFAULT: 'default',
  NO_WORKOUTS: 'no-workouts'
} as const;

export interface Exercise {
  _id?: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface Workout {
  _id?: string;
  name: string;
  exercises: Exercise[];
}

interface WorkoutContextType {
  workouts: Workout[];
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (id: string, workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  selectedWorkout: Workout | null;
  setSelectedWorkout: (workout: Workout | null) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    } else {
      setWorkouts([]);
    }
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/workouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkouts(data);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const addWorkout = async (workout: Workout) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workout),
      });

      if (response.ok) {
        await fetchWorkouts(); // Znovu načteme všechny workouty
      }
    } catch (error) {
      console.error('Error adding workout:', error);
    }
  };

  const updateWorkout = async (id: string, workout: Workout) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workout),
      });

      if (response.ok) {
        await fetchWorkouts();
      }
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        await fetchWorkouts();
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        selectedWorkout,
        setSelectedWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}

// Pomocné funkce pro práci s hodnotami
export const isEmptyValue = (value: string) => 
  !value || value === WORKOUT_DEFAULTS.NONE || value === WORKOUT_DEFAULTS.DEFAULT;

export const getDisplayValue = (value: string) => 
  isEmptyValue(value) ? '' : value;

export const getSafeValue = (value: string) => 
  value || WORKOUT_DEFAULTS.DEFAULT;

