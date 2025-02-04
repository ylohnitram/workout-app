"use client"

import { useState } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WORKOUT_DEFAULTS } from '@/contexts/WorkoutContext'

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

interface DayPlan {
  day: string;
  workoutId: string | null;
}

export default function WeekPlanner() {
  const { workouts = [], selectedWorkout, setSelectedWorkout } = useWorkout()
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>(
    DAYS.map(day => ({ day, workoutId: null }))
  )

  const safeWorkouts = Array.isArray(workouts) ? workouts : []

  const handleWorkoutSelect = (day: string, workoutId: string) => {
    setWeekPlan(currentPlan =>
      currentPlan.map(dayPlan => 
        dayPlan.day === day
          ? { ...dayPlan, workoutId: workoutId === WORKOUT_DEFAULTS.NONE ? null : workoutId }
          : dayPlan
      )
    )

    // Nastavíme selectedWorkout pouze pro vybraný den
    const workout = safeWorkouts.find(w => w._id === workoutId)
    if (workoutId === WORKOUT_DEFAULTS.NONE) {
      setSelectedWorkout(null)
    } else if (workout) {
      setSelectedWorkout(workout)
    }
  }

  return (
    <div className="grid gap-4">
      {DAYS.map((day) => {
        const dayPlan = weekPlan.find(p => p.day === day)
        const currentWorkoutId = dayPlan?.workoutId || WORKOUT_DEFAULTS.NONE

        return (
          <div key={day} className="flex items-center gap-4">
            <span className="w-24 font-medium">{day}</span>
            <Select
              value={currentWorkoutId}
              onValueChange={(value) => handleWorkoutSelect(day, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Vyberte trénink" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WORKOUT_DEFAULTS.NONE}>Žádný trénink</SelectItem>
                {safeWorkouts.map((workout) => (
                  <SelectItem 
                    key={workout._id} 
                    value={workout._id || WORKOUT_DEFAULTS.DEFAULT}
                  >
                    {workout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </div>
  )
}
