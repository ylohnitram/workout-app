"use client"

import { useWorkout } from "../../contexts/WorkoutContext"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle } from "lucide-react"

export default function WorkoutExecution() {
  const { workouts, activeWorkout, startWorkout, completeSet, resetWorkout } = useWorkout()
  const today = new Date().toLocaleDateString("cs-CZ", { weekday: "long" })

  if (!activeWorkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dnešní trénink</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Vyberte trénink pro dnešní den ({today}):</p>
          {workouts.map((workout) => (
            <Button key={workout.id} onClick={() => startWorkout(workout.id)} className="mr-2 mb-2">
              {workout.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    )
  }

  const currentWorkout = workouts.find((w) => w.id === activeWorkout.workoutId)
  if (!currentWorkout) return null

  const phases = ["warmup", "main", "cooldown"] as const
  const phaseNames = {
    warmup: "Rozehřátí",
    main: "Hlavní trénink",
    cooldown: "Dopumpování",
  }

  const getPhaseExercises = (phase: (typeof phases)[number]) => {
    return activeWorkout.exercises.filter((exercise) => currentWorkout.phases[phase].exerciseIds.includes(exercise.id))
  }

  const calculatePhaseProgress = (phase: (typeof phases)[number]) => {
    const phaseExercises = getPhaseExercises(phase)
    const totalSets = phaseExercises.reduce((sum, e) => sum + e.sets, 0)
    const completedSets = phaseExercises.reduce((sum, e) => sum + e.completedSets, 0)
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  }

  const totalSets = activeWorkout.exercises.reduce((sum, e) => sum + e.sets, 0)
  const totalCompletedSets = activeWorkout.exercises.reduce((sum, e) => sum + e.completedSets, 0)
  const overallProgress = (totalCompletedSets / totalSets) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Probíhající trénink: {currentWorkout.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Celkový průběh</h3>
          <Progress value={overallProgress} className="mb-2" />
          <p className="text-sm text-gray-500">
            {totalCompletedSets}/{totalSets} sérií
          </p>
        </div>

        {phases.map((phase) => (
          <div key={phase} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{phaseNames[phase]}</h3>
            <Progress value={calculatePhaseProgress(phase)} className="mb-2" />
            {getPhaseExercises(phase).map((exercise) => (
              <div key={exercise.id} className="mb-4">
                <h4 className="text-md font-medium mb-2">{exercise.name}</h4>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: exercise.sets }).map((_, index) => (
                    <Button
                      key={index}
                      variant={index < exercise.completedSets ? "default" : "outline"}
                      size="sm"
                      onClick={() => completeSet(exercise.id)}
                      disabled={index < exercise.completedSets}
                    >
                      {index < exercise.completedSets ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  ))}
                  <span className="text-sm text-gray-500">
                    {exercise.completedSets}/{exercise.sets} x {exercise.reps}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}

        <Button onClick={resetWorkout} variant="destructive" className="mt-4">
          Ukončit trénink
        </Button>
      </CardContent>
    </Card>
  )
}

