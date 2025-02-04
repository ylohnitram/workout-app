"use client"

import { useState, useEffect } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WORKOUT_DEFAULTS } from '@/contexts/WorkoutContext'
import { useAuth } from "@/contexts/AuthContext"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

interface DayPlan {
  day: string;
  workoutId: string | null;
}

const CACHE_KEY = 'weekPlanCache';

export default function WeekPlanner() {
  const { workouts, selectedWorkout, setSelectedWorkout } = useWorkout()
  const { user } = useAuth()
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>(() => {
    // Pokus o načtení z cache při inicializaci
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached week plan:', e);
      }
    }
    return DAYS.map(day => ({ day, workoutId: null }));
  })
  const [isLoading, setIsLoading] = useState(true)

  const safeWorkouts = Array.isArray(workouts) ? workouts : []

  // Načtení týdenního plánu
  useEffect(() => {
    const fetchWeekPlan = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

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
            // Uložení do cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(data.dayPlans));
          }
        }
      } catch (error) {
        console.error('Failed to fetch week plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeekPlan();
  }, [user]);

  // Uložení týdenního plánu
  const saveWeekPlan = async (newPlan: DayPlan[]) => {
    if (!user) return;

    try {
      // Okamžitě aktualizujeme cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(newPlan));
      
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

    const workout = safeWorkouts.find(w => w._id === workoutId);
    if (workoutId === WORKOUT_DEFAULTS.NONE) {
      setSelectedWorkout(null);
    } else if (workout) {
      setSelectedWorkout(workout);
    }
  };

  return (
    <>
      <Dialog open={isLoading}>
        <DialogContent className="sm:max-w-md flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-lg">Načítám plán tréninků...</p>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
