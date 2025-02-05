"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WORKOUT_DEFAULTS } from '@/contexts/WorkoutContext'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

interface DayPlan {
  day: string;
  workoutId: string | null;
}

const CACHE_KEY = 'weekPlanCache';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hodina

export default function WeekPlanner() {
  const { workouts, selectedWorkout, setSelectedWorkout } = useWorkout()
  const { user } = useAuth()
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Kontrola expirace cache
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      } catch (e) {
        console.error('Failed to parse cached week plan:', e);
      }
    }
    return DAYS.map(day => ({ day, workoutId: null }));
  });
  const [isLoading, setIsLoading] = useState(true);

  const safeWorkouts = Array.isArray(workouts) ? workouts : [];

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
          const { data } = await response.json();
          if (data?.dayPlans) {
            setWeekPlan(data.dayPlans);
            // Uložení do cache s časovým razítkem
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: data.dayPlans,
              timestamp: Date.now()
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch week plan:', error);
        // Při chybě se pokusíme použít cache bez ohledu na expiraci
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data } = JSON.parse(cached);
            setWeekPlan(data);
          } catch (e) {
            console.error('Failed to parse cached week plan:', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeekPlan();
  }, [user]);

  const saveWeekPlan = async (newPlan: DayPlan[]) => {
    if (!user) return;

    try {
      // Okamžitě aktualizujeme UI a cache
      setWeekPlan(newPlan);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newPlan,
        timestamp: Date.now()
      }));
      
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
