"use client"

import { useRouter } from "next/navigation"
import { useWorkout } from "../../contexts/WorkoutContext"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dumbbell } from "lucide-react"

export default function WorkoutExecution() {
  const router = useRouter()
  const { workouts, startWorkout, activeWorkout } = useWorkout()
  const today = new Date().toLocaleDateString("cs-CZ", { weekday: "long" })

  const handleStartWorkout = (workoutId: string) => {
    startWorkout(workoutId)
    router.push("/progress")
  }

  if (activeWorkout) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Máte aktivní trénink</p>
            <Button onClick={() => router.push("/progress")}>
              <Dumbbell className="w-4 h-4 mr-2" />
              Pokračovat v tréninku
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dnešní trénink</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Vyberte trénink pro dnešní den ({today}):</p>
        <div className="flex flex-wrap gap-2">
          {workouts.map((workout) => (
            <Button
              key={workout._id}
              onClick={() => handleStartWorkout(workout._id!)}
              className="flex items-center"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              {workout.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
