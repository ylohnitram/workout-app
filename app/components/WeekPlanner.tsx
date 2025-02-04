"use client"

import { useState, useEffect } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WORKOUT_DEFAULTS } from '@/contexts/WorkoutContext'
import { useAuth } from "@/contexts/AuthContext"

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

interface DayPlan {
  day: string;
  workoutId: string | null;
}

export default function WeekPlanner() {
  const { workouts, selectedWorkout, setSelectedWorkout } = useWorkout()
  const { user } = useAuth()
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>(
    DAYS.map(day => ({ day, workoutId: null }))
  )

  const safeWorkouts = Array.isArray(workouts) ? workouts : []

  // Načtení týdenního plánu
  useEffect(() => {
    const fetchWeekPlan = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/week-plan', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.dayPlans) {
            setWeekPlan(data.dayPlans);
          }
        }
      } catch (error) {
        console.error('Failed to fetch week plan:', error);
      }
    };

    fetchWeekPlan();
  }, [user]);

  // Uložení týdenního plánu
  const saveWeekPlan = async (newPlan: DayPlan[]) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      await fetch('/api/week-plan', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dayPlans: newPlan })
      });
    } catch (error) {
      console.error('Failed to save week plan:', error);
    }
  };

  const handleWorkoutSelect = async (day: string, workoutId: string) => {
    const newPlan = weekPlan.map(dayPlan => 
      dayPlan.day === day
        ? { ...dayPlan, workoutId: workoutId === WORKOUT_DEFAULTS.NONE ? null : workoutId }
        : dayPlan
    );
    
    setWeekPlan(newPlan);
    await saveWeekPlan(newPlan);

    // Nastavíme selectedWorkout pouze pro vybraný den
    const workout = safeWorkouts.find(w => w._id === workoutId);
    if (workoutId === WORKOUT_DEFAULTS.NONE) {
      setSelectedWorkout(null);
    } else if (workout) {
      setSelectedWorkout(workout);
    }
  };

  return (
    <div className="grid gap-4">
      {DAYS.map((day) => {
        const dayPlan = weekPlan.find(p => p.day === day);
        const currentWorkoutId = dayPlan?.workoutId || WORKOUT_DEFAULTS.NONE;
        const selectedWorkout = safeWorkouts.find(w => w._id === currentWorkoutId);

        return (
          <div key={day} className="flex items-center gap-4">
            <span className="w-24 font-medium">{day}</span>
            <Select
              value={currentWorkoutId}
              onValueChange={(value) => handleWorkoutSelect(day, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Vyberte trénink">
                  {selectedWorkout ? selectedWorkout.name : 'Žádný trénink'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WORKOUT_DEFAULTS.NONE}>Žádný trénink</SelectItem>
                {safeWorkouts.map((workout) => (
                  workout._id ? (
                    <SelectItem key={workout._id} value={workout._id}>
                      {workout.name || 'Unnamed workout'}
                    </SelectItem>
                  ) : null
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
