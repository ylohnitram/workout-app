"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
      console.log('Fetched workouts:', result);

      if (Array.isArray(result)) {
        setWorkouts(result);
      } else if (Array.isArray(result.data)) {
        setWorkouts(result.data);
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
    if (!user) {
      setWorkouts([]);
      setSelectedWorkout(null);
    } else {
      fetchWorkouts();
    }
  }, [user]);

  const addWorkout = async (workout: Workout) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      console.log('Sending workout:', workout);

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        return;
      }

      const result = await response.json();
      console.log('Server response:', result);

      await fetchWorkouts();
    } catch (error) {
      console.error('Error adding workout:', error);
    }
  };

  const updateWorkout = async (id: string, workout: Workout) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        return;
      }

      await fetchWorkouts();
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

      await fetchWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const value = {
    workouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    selectedWorkout,
    setSelectedWorkout,
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
