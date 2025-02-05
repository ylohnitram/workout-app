"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext" 
import { useWorkout } from "@/contexts/WorkoutContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { SetType } from '@/types/exercise'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GripVertical, Trash2Icon, Edit2Icon } from "lucide-react"
import { ExerciseSelector } from './ExerciseSelector'

interface SortableExerciseItemProps {
  id: string
  exercise: any
  onEdit: () => void
  onRemove: () => void
}

interface Exercise {
  _id: string;
  name: string;
  category?: string;
  isSystem: boolean;
}

function SortableExerciseItem({ id, exercise, onEdit, onRemove }: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-100 p-4 rounded-lg mb-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <button {...listeners} {...attributes} className="p-2 hover:bg-gray-200 rounded mr-2">
            <GripVertical className="h-4 w-4 text-gray-500" />
          </button>
          <div>
            <h3 className="font-medium">{exercise.name}</h3>
            <div className="text-sm text-gray-600">
              {exercise.sets.map((set: any, setIndex: number) => (
                <div key={setIndex}>
                  Série {setIndex + 1}: {set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}
                  {set.type === SetType.REST_PAUSE && set.restPauseSeconds && 
                    ` (rest-pause ${set.restPauseSeconds}s)`
                  }
                  {set.type === SetType.DROP && set.dropSets && (
                    <span className="ml-1">
                      + {set.dropSets.map((drop: any) => 
                        `${drop.weight}kg`
                      ).join(' → ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2Icon className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function WorkoutEditor() {
  const { user } = useAuth()
  const { workouts, addWorkout, updateWorkout, deleteWorkout, selectedWorkout, setSelectedWorkout } = useWorkout()
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  const [systemExercises, setSystemExercises] = useState<Exercise[]>([])
  const [userExercises, setUserExercises] = useState<Exercise[]>([])
  const [workoutName, setWorkoutName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const fetchExercises = async () => {
      if (!user) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/exercises', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && selectedWorkout) {
      const oldIndex = selectedWorkout.exercises.findIndex(ex => ex.exerciseId === active.id);
      const newIndex = selectedWorkout.exercises.findIndex(ex => ex.exerciseId === over.id);

      const newExercises = arrayMove(selectedWorkout.exercises, oldIndex, newIndex);
      updateWorkout(selectedWorkout._id!, {
        ...selectedWorkout,
        exercises: newExercises
      });
    }
  };

  const handleWorkoutSelect = (workoutId: string) => {
    const workout = workouts.find(w => w._id === workoutId);
    setSelectedWorkout(workout || null);
  };

  const handleExerciseEdit = (exerciseIndex: number, updatedSets: any[]) => {
    if (!selectedWorkout) return;

    const newExercises = [...selectedWorkout.exercises];
    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      sets: updatedSets
    };

    updateWorkout(selectedWorkout._id!, {
      ...selectedWorkout,
      exercises: newExercises
    });
    setEditingExerciseIndex(null);
  };

  const handleRemoveExercise = async (index: number) => {
    if (!selectedWorkout?._id) return;

    try {
      const newExercises = selectedWorkout.exercises.filter((_, i) => i !== index);
      await updateWorkout(selectedWorkout._id, {
        ...selectedWorkout,
        exercises: newExercises
      });
    } catch (error) {
      console.error('Failed to remove exercise:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Karta pro vytvoření nového tréninku */}
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

      {/* Karta pro výběr tréninku */}
      <Card>
        <CardHeader>
          <CardTitle>Vybrat trénink</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Select
              value={selectedWorkout?._id || ''}
              onValueChange={handleWorkoutSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Vyberte trénink" />
              </SelectTrigger>
              <SelectContent>
                {workouts.map((workout) => (
                  workout._id ? (
                    <SelectItem key={workout._id} value={workout._id}>
                      {workout.name}
                    </SelectItem>
                  ) : null
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
                    <AlertDialogAction onClick={() => deleteWorkout(selectedWorkout._id!)}>
                      Smazat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seznam cviků s DnD a editací */}
      {selectedWorkout && (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedWorkout.exercises.map(ex => ex.exerciseId)}
              strategy={verticalListSortingStrategy}
            >
              {selectedWorkout.exercises.map((exercise, index) => (
                <SortableExerciseItem
                  key={exercise.exerciseId}
                  id={exercise.exerciseId}
                  exercise={exercise}
                  onEdit={() => setEditingExerciseIndex(index)}
                  onRemove={() => handleRemoveExercise(index)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Dialog pro editaci cviku */}
          <Dialog open={editingExerciseIndex !== null} onOpenChange={() => setEditingExerciseIndex(null)}>
            <DialogContent className="max-w-2xl">
              {editingExerciseIndex !== null && selectedWorkout && (
                <ExerciseSelector
                  systemExercises={systemExercises}
                  userExercises={userExercises}
                  onExerciseAdd={() => {}}
                  initialExercise={selectedWorkout.exercises[editingExerciseIndex]}
                  onSave={(updatedSets) => handleExerciseEdit(editingExerciseIndex, updatedSets)}
                  onCancel={() => setEditingExerciseIndex(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Selektor pro přidávání nových cviků */}
          <ExerciseSelector
            systemExercises={systemExercises}
            userExercises={userExercises}
            onExerciseAdd={async (exerciseId, isSystem, sets) => {
              if (!selectedWorkout?._id) return;

              const selectedExercise = isSystem
                ? systemExercises.find(e => e._id === exerciseId)
                : userExercises.find(e => e._id === exerciseId);

              if (!selectedExercise) return;

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
            }}
          />
        </>
      )}
    </div>
  )
}
