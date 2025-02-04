"use client"

import { useState } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2Icon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WORKOUT_DEFAULTS, getDisplayValue, getSafeValue } from '@/contexts/WorkoutContext'

interface Exercise {
  _id?: string
  name: string
  sets: number
  reps: number
  weight: number
}

export default function WorkoutEditor() {
  const { workouts = [], addWorkout, updateWorkout, deleteWorkout, selectedWorkout, setSelectedWorkout } = useWorkout()
  const [workoutName, setWorkoutName] = useState(WORKOUT_DEFAULTS.DEFAULT)
  const [newExercise, setNewExercise] = useState<Exercise>({
    name: WORKOUT_DEFAULTS.DEFAULT,
    sets: 0,
    reps: 0,
    weight: 0
  })

  // Zajistíme, že workouts je vždy pole
  const safeWorkouts = Array.isArray(workouts) ? workouts : []

  const handleAddWorkout = async () => {
    if (workoutName !== WORKOUT_DEFAULTS.DEFAULT) {
      try {
        console.log('Adding workout with data:', {
          name: workoutName,
          exercises: []
        });
        const result = await addWorkout({
          name: workoutName,
          exercises: []
        });
        console.log('Workout added, result:', result);
        // Resetujeme až po úspěšném přidání
        setWorkoutName(WORKOUT_DEFAULTS.DEFAULT);
      } catch (error) {
        console.error('Failed to add workout:', error);
      }
    }
  }

  const handleAddExercise = async () => {
    if (selectedWorkout && selectedWorkout._id && newExercise.name !== WORKOUT_DEFAULTS.DEFAULT) {
      try {
        await updateWorkout(selectedWorkout._id, {
          ...selectedWorkout,
          exercises: [...selectedWorkout.exercises, newExercise]
        });
        // Resetujeme až po úspěšném přidání
        setNewExercise({
          name: WORKOUT_DEFAULTS.DEFAULT,
          sets: 0,
          reps: 0,
          weight: 0
        });
      } catch (error) {
        console.error('Failed to add exercise:', error);
      }
    }
  }

  const handleDeleteWorkout = async () => {
    if (selectedWorkout?._id) {
      await deleteWorkout(selectedWorkout._id)
      setSelectedWorkout(null)
    }
  }

  const handleRemoveExercise = async (index: number) => {
    if (selectedWorkout && selectedWorkout._id) {
      const newExercises = [...selectedWorkout.exercises]
      newExercises.splice(index, 1)
      await updateWorkout(selectedWorkout._id, {
        ...selectedWorkout,
        exercises: newExercises
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Vytvořit nový trénink</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={getDisplayValue(workoutName)}
              onChange={(e) => setWorkoutName(getSafeValue(e.target.value))}
              placeholder="Název tréninku"
            />
            <Button onClick={handleAddWorkout}>Přidat trénink</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upravit trénink</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Select
                value={selectedWorkout?._id || WORKOUT_DEFAULTS.NONE}
                onValueChange={(value) => {
                  const workout = safeWorkouts.find(w => w._id === value)
                  setSelectedWorkout(workout || null)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vyberte trénink" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WORKOUT_DEFAULTS.NONE}>Vyberte trénink</SelectItem>
                  {safeWorkouts.length > 0 ? (
                    safeWorkouts.map((workout) => (
                      <SelectItem key={workout._id} value={workout._id || WORKOUT_DEFAULTS.DEFAULT}>
                        {workout.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={WORKOUT_DEFAULTS.NO_WORKOUTS} disabled>
                      Žádné tréninky k dispozici
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {selectedWorkout && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Opravdu chcete smazat tento trénink?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tato akce je nevratná. Trénink bude odstraněn.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Zrušit</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteWorkout}>Smazat</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {selectedWorkout && (
              <div className="space-y-4">
                <h3 className="font-medium">Přidat nový cvik</h3>
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    placeholder="Název cviku"
                    value={newExercise.name === WORKOUT_DEFAULTS.DEFAULT ? "" : newExercise.name}
                    onChange={(e) => setNewExercise(prev => ({
                      ...prev,
                      name: e.target.value || WORKOUT_DEFAULTS.DEFAULT
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Série"
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, sets: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Opakování"
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, reps: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Váha (kg)"
                    value={newExercise.weight}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, weight: Number(e.target.value) }))}
                  />
                </div>
                <Button onClick={handleAddExercise}>Přidat cvik</Button>

                {selectedWorkout.exercises.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Cviky v tréninku</h3>
                    <div className="space-y-2">
                      {selectedWorkout.exercises.map((exercise, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                          <span>
                            {exercise.name}: {exercise.sets}x{exercise.reps} ({exercise.weight}kg)
                          </span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveExercise(index)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

