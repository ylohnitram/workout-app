"use client"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WORKOUT_DEFAULTS } from '@/contexts/WorkoutContext'

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

export default function WeekPlanner() {
  const { workouts = [], selectedWorkout, setSelectedWorkout } = useWorkout()

  // Zajistíme, že workouts je vždy pole
  const safeWorkouts = Array.isArray(workouts) ? workouts : []

  return (
    <div className="grid gap-4">
      {DAYS.map((day) => (
        <div key={day} className="flex items-center gap-4">
          <span className="w-24 font-medium">{day}</span>
          <Select
            value={selectedWorkout?._id || WORKOUT_DEFAULTS.NONE}
            onValueChange={(value) => {
              const workout = safeWorkouts.find((w) => w._id === value)
              setSelectedWorkout(workout || null)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Vyberte trénink" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WORKOUT_DEFAULTS.NONE}>Žádný trénink</SelectItem>
              {safeWorkouts.length > 0 ? (
                safeWorkouts.map((workout) => (
                  <SelectItem 
                    key={workout._id} 
                    value={workout._id || WORKOUT_DEFAULTS.DEFAULT}
                  >
                    {workout.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem 
                  value={WORKOUT_DEFAULTS.NO_WORKOUTS} 
                  disabled
                >
                  Žádné tréninky k dispozici
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}

