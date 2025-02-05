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
import { ExerciseSelector } from '@/app/components/ExerciseSelector'
import type { IExercise as Exercise, ExerciseSet, SetType } from '@/models/exercise'

export default function WorkoutEditor() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout, selectedWorkout, setSelectedWorkout } = useWorkout()
  const [workoutName, setWorkoutName] = useState("")
  const [systemExercises, setSystemExercises] = useState<Exercise[]>([])
  const [userExercises, setUserExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const safeWorkouts = Array.isArray(workouts) ? workouts : []

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('/api/admin/exercises')
        if (response.ok) {
          const { data } = await response.json()
          setSystemExercises(data)
        }
        // TODO: Přidat načítání uživatelských cviků až bude API
        setUserExercises([])
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
    if (!name) {
      console.warn('Empty workout name')
      return
    }

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
      await updateWorkout(selectedWorkout._id, {
        ...selectedWorkout,
        exercises: [
          ...selectedWorkout.exercises,
          {
            exerciseId,
            isSystem,
            name: selectedExercise.name,
            sets
          }
        ]
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

    try {
      await updateWorkout(selectedWorkout._id, {
        ...selectedWorkout,
        exercises: selectedWorkout.exercises.filter((_, i) => i !== index)
      })
    } catch (error) {
      console.error('Failed to remove exercise:', error)
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
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Název tréninku"
            />
            <Button onClick={handleAddWorkout}>Přidat trénink</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vybrat trénink</CardTitle>
        </CardHeader>
        <CardContent>
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
                {safeWorkouts.filter(workout => workout._id).map((workout) => (
                  <SelectItem key={workout._id} value={workout._id as string}>
                    {workout.name || 'Unnamed workout'}
                  </SelectItem>
                ))}
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
        </CardContent>
      </Card>

      {selectedWorkout && (
        <>
          <ExerciseSelector
            systemExercises={systemExercises}
            userExercises={userExercises}
            onExerciseAdd={handleExerciseAdd}
          />

          <Card>
            <CardHeader>
              <CardTitle>Cviky v tréninku</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedWorkout.exercises.map((exercise, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <div>
                      <h3 className="font-medium">{exercise.name}</h3>
                      <div className="text-sm text-gray-600">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex}>
                            Série {setIndex + 1}: {set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}
                            {set.type === 'rest_pause' && ` (rest-pause ${set.restPauseSeconds}s)`}
                            {set.type === 'drop' && set.dropSets && (
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
