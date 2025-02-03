"use client"
import { useWorkout } from "../../contexts/WorkoutContext"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export default function WorkoutTracker() {
  const { workouts, weekPlan, updateExerciseInWorkout, resetWorkout } = useWorkout()
  const today = new Date().toLocaleDateString("cs-CZ", { weekday: "long" })
  const todayWorkoutId = weekPlan[today]
  const todayWorkout = workouts.find((w) => w.id === todayWorkoutId)

  if (!todayWorkout) {
    return <div>Dnes nemáte naplánovaný žádný trénink.</div>
  }

  const handleSetComplete = (exerciseId: string) => {
    updateExerciseInWorkout(todayWorkout.id, exerciseId)
  }

  const handleResetWorkout = () => {
    resetWorkout(todayWorkout.id)
  }

  const workoutProgress =
    (todayWorkout.exercises.filter((e) => e.completed).length / todayWorkout.exercises.length) * 100

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Dnešní trénink: {todayWorkout.name}</h3>
      <Progress value={workoutProgress} className="w-full" />
      {todayWorkout.exercises.map((exercise) => (
        <div key={exercise.id} className="flex items-center justify-between space-x-2">
          <span className={exercise.completed ? "line-through" : ""}>
            {exercise.name} ({exercise.remainingSets}/{exercise.sets} x {exercise.reps})
          </span>
          <Button onClick={() => handleSetComplete(exercise.id)} disabled={exercise.completed}>
            Dokončit sérii
          </Button>
        </div>
      ))}
      <Button onClick={handleResetWorkout}>Resetovat trénink</Button>
    </div>
  )
}

