"use client"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

export default function WeekPlanner() {
  const { workouts, selectedWorkout, setSelectedWorkout } = useWorkout()

  return (
    <div className="grid gap-4">
      {DAYS.map((day) => (
        <div key={day} className="flex items-center gap-4">
          <span className="w-24 font-medium">{day}</span>
          <Select
            value={selectedWorkout?._id || "none"}
            onValueChange={(value) => {
              const workout = workouts.find((w) => w._id === value)
              setSelectedWorkout(workout || null)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Vyberte trénink" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Žádný trénink</SelectItem>
              {workouts?.map((workout) => (
                <SelectItem key={workout._id} value={workout._id || 'default'}>
                  {workout.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}

