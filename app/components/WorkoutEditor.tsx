"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext" 
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
import { SetType } from '@/types/exercise'

interface DropSet {
  weight: number;
  reps: number;
}

interface ExerciseSet {
  type: SetType;
  weight: number;
  reps: number | 'failure';
  restPauseSeconds?: number;
  dropSets?: DropSet[];
}

interface WorkoutExercise {
  exerciseId: string;
  isSystem: boolean;
  name: string;
  sets: ExerciseSet[];
}

interface Exercise {
  _id?: string;
  name: string;
  category?: string;
}

export default function WorkoutEditor() {
  const { user } = useAuth()
  const { workouts, addWorkout, updateWorkout, deleteWorkout, selectedWorkout, setSelectedWorkout } = useWorkout()
  const [workoutName, setWorkoutName] = useState("")
  const [systemExercises, setSystemExercises] = useState<Exercise[]>([])
  const [userExercises, setUserExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const safeWorkouts = Array.isArray(workouts) ? workouts : []

  useEffect(() => {
    const fetchExercises = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching exercises...');
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/exercises', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Exercises response:', result);
          const { data } = result;
          setSystemExercises(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [user]);

  const handleAddWorkout = async () => {
    const name = workoutName.trim();
    if (!name) {
      console.warn('Empty workout name');
      return;
    }

    try {
      await addWorkout({
        name,
        exercises: []
      });
      setWorkoutName("");
    } catch (error) {
      console.error('Failed to add workout:', error);
    }
  };

  const handleExerciseAdd = async (exerciseId: string, isSystem: boolean, sets: ExerciseSet[]) => {
    if (!selectedWorkout?._id) return;

    const selectedExercise = isSystem
      ? systemExercises.find(e => e._id === exerciseId)
      : userExercises.find(e => e._id === exerciseId);

    if (!selectedExercise) return;

    try {
      console.log('Adding exercise:', {
        exerciseId,
        isSystem,
        name: selectedExercise.name,
        sets
      });

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
      });
    } catch (error) {
      console.error('Failed to add exercise to workout:', error);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!selectedWorkout?._id) return;
    
    try {
      await deleteWorkout(selectedWorkout._id);
      setSelectedWorkout(null);
    } catch (error) {
      console.error('Failed to delete workout:', error);
    }
  };

  const handleRemoveExercise = async (index: number) => {
    if (!selectedWorkout?._id) return;

    try {
      await updateWorkout(selectedWorkout._id, {
        ...selectedWorkout,
        exercises: selectedWorkout.exercises.filter((_, i) => i !== index)
      });
    } catch (error) {
      console.error('Failed to remove exercise:', error);
    }
  };

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
                const workout = safeWorkouts.find(w => w._id === value);
                setSelectedWorkout(workout || null);
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
                {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
                  selectedWorkout.exercises.map((exercise, index) => (
                    <div key={`${exercise.exerciseId}-${index}`} className="flex justify-between items-start p-4 bg-gray-100 rounded">
                      <div className="space-y-2">
                        <h3 className="font-medium">{exercise.name}</h3>
                        <div className="space-y-1">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={`${exercise.exerciseId}-${index}-${setIndex}`} className="text-sm text-gray-600">
                              <span className="font-medium">Série {setIndex + 1}: </span>
                              {set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}
                              
                              {set.type === SetType.REST_PAUSE && set.restPauseSeconds && (
                                <span className="ml-2 text-blue-600">
                                  (rest-pause {set.restPauseSeconds}s)
                                </span>
                              )}
                              
                              {set.type === SetType.DROP && set.dropSets && set.dropSets.length > 0 && (
                                <span className="ml-2 text-green-600">
                                  + {set.dropSets.map((drop, i) => 
                                    `${drop.weight}kg×${drop.reps}`
                                  ).join(' + ')}
                                </span>
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
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
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
