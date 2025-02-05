"use client"

import { useState, useEffect } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
import { WORKOUT_DEFAULTS } from '@/contexts/WorkoutContext'
import { ExerciseSelector } from './ExerciseSelector'
import { Exercise, SetType } from '@/models/exercise'

export default function WorkoutEditor() {
  const { workouts = [], selectedWorkout, setSelectedWorkout, addWorkout, updateWorkout, deleteWorkout } = useWorkout()
  const [workoutName, setWorkoutName] = useState("")
  const [systemExercises, setSystemExercises] = useState<Exercise[]>([])
  const [userExercises, setUserExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        // Načtení systémových cviků
        const sysResponse = await fetch('/api/admin/exercises')
        if (sysResponse.ok) {
          const { data } = await sysResponse.json()
          setSystemExercises(data)
        }

        // Načtení uživatelských cviků (zde bude potřeba implementovat API)
        setUserExercises([]) // Prozatím prázdné
      } catch (error) {
        console.error('Failed to fetch exercises:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExercises()
  }, [])

  const handleAddWorkout = async () => {
    const name = workoutName.trim()
    if (!name) return

    try {
      await addWorkout({
        name,
        exercises: []
      })
      setWorkoutName("")
    } catch (error) {
      console.error('Failed to add workout:', error)
    }
  }

  const handleExerciseAdd = async (exerciseId: string, isSystem: boolean, sets: any[]) => {
    if (!selectedWorkout?._id) return

    const selectedExercise = isSystem
      ? systemExercises.find(e => e._id === exerciseId)
      : userExercises.find(e => e._id === exerciseId)

    if (!selectedExercise) return

    try {
      const updatedExercises = [
        ...selectedWorkout.exercises,
        {
          exerciseId,
          isSystem,
          name: selectedExercise.name,
          sets
        }
      ]

      await updateWorkout(selectedWorkout._id, {
        ...selectedWorkout,
        exercises: updatedExercises
      })
    } catch (error) {
      console.error('Failed to add exercise to workout:', error)
    }
  }

  const handleDeleteWorkout = async () => {
    if (!selectedWorkout?._id) return
    
    try {
      await deleteWorkout(selectedWorkout._id)
      setSelectedWorkout(null)
    } catch (error) {
      console.error('Failed to delete workout:', error)
    }
  }

  const handleRemoveExercise = async (index: number) => {
    if (!selectedWorkout?._id) return

    const newExercises = [...selectedWorkout.exercises]
    newExercises.splice(index, 1)
    
    try {
      await updateWorkout(selectedWorkout._id, {
        ...selectedWorkout,
        exercises: newExercises
      })
    } catch (error) {
      console.error('Failed to remove exercise:', error)
    }
  }

  if (isLoading) {
    return <div>Načítání...</div>
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
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Název tréninku"
            />
            <Button onClick={handleAddWorkout}>Přidat trénink</Button>
          </div>
        </CardContent>
      </Card>

      {selectedWorkout && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upravit trénink: {selectedWorkout.name}</CardTitle>
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
            </CardHeader>
            <CardContent>
              <ExerciseSelector
                systemExercises={systemExercises}
                userExercises={userExercises}
                onExerciseAdd={handleExerciseAdd}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cviky v tréninku</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedWorkout.exercises.map((exercise, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-100 rounded">
                    <div>
                      <h3 className="font-medium">{exercise.name}</h3>
                      <div className="text-sm text-gray-600">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex}>
                            Série {setIndex + 1}: {set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}
                            {set.type === SetType.REST_PAUSE && ` (rest-pause ${set.restPauseSeconds}s)`}
                            {set.type === SetType.DROP && set.dropSets && (
                              <span> + {set.dropSets.map(drop => 
                                `${drop.weight}kg×${drop.reps}`
                              ).join(' + ')}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {selectedWorkout.exercises.length === 0 && (
                  <div className="text-center text-gray-500">
                    Zatím žádné cviky
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
