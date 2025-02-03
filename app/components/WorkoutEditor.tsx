"use client"

import { useState, useMemo } from "react"
import { useWorkout } from "../../contexts/WorkoutContext"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowRightIcon, ArrowLeftIcon, Trash2Icon, Edit2Icon } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function WorkoutEditor() {
  const {
    exercises,
    workouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    updateExercise,
    removeExerciseFromWorkout,
    deleteExercise,
  } = useWorkout()
  const [workoutName, setWorkoutName] = useState("")
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)
  const [editingExercise, setEditingExercise] = useState<{
    id: string
    name: string
    sets: number
    reps: number
  } | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<"warmup" | "main" | "cooldown">("main")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleAddWorkout = () => {
    if (workoutName) {
      addWorkout({
        id: Date.now().toString(),
        name: workoutName,
        phases: {
          warmup: { name: "Rozehřátí", exerciseIds: [] },
          main: { name: "Trénink", exerciseIds: [] },
          cooldown: { name: "Dopumpování", exerciseIds: [] },
        },
      })
      setWorkoutName("")
    }
  }

  const currentWorkout = useMemo(() => workouts.find((w) => w.id === selectedWorkout), [workouts, selectedWorkout])

  const availableExercises = useMemo(
    () =>
      exercises.filter(
        (exercise) =>
          !currentWorkout?.phases.warmup.exerciseIds.includes(exercise.id) &&
          !currentWorkout?.phases.main.exerciseIds.includes(exercise.id) &&
          !currentWorkout?.phases.cooldown.exerciseIds.includes(exercise.id),
      ),
    [exercises, currentWorkout],
  )

  const onDragEnd = (result: any) => {
    if (!result.destination || !selectedWorkout || !currentWorkout) return

    const { source, destination, draggableId } = result

    const sourcePhase =
      source.droppableId === "available"
        ? "available"
        : (source.droppableId.split("-")[0] as "warmup" | "main" | "cooldown")
    const destPhase =
      destination.droppableId === "available"
        ? "available"
        : (destination.droppableId.split("-")[0] as "warmup" | "main" | "cooldown")

    if (sourcePhase === "available" && destPhase !== "available") {
      // Adding exercise to a phase
      updateWorkout({
        ...currentWorkout,
        phases: {
          ...currentWorkout.phases,
          [destPhase]: {
            ...currentWorkout.phases[destPhase],
            exerciseIds: [...currentWorkout.phases[destPhase].exerciseIds, draggableId],
          },
        },
      })
    } else if (sourcePhase !== "available" && destPhase === "available") {
      // Removing exercise from a phase
      updateWorkout({
        ...currentWorkout,
        phases: {
          ...currentWorkout.phases,
          [sourcePhase]: {
            ...currentWorkout.phases[sourcePhase],
            exerciseIds: currentWorkout.phases[sourcePhase].exerciseIds.filter((id) => id !== draggableId),
          },
        },
      })
    } else if (sourcePhase !== "available" && destPhase !== "available") {
      // Moving exercise between phases or reordering within a phase
      const newSourceExerciseIds = Array.from(currentWorkout.phases[sourcePhase].exerciseIds)
      newSourceExerciseIds.splice(source.index, 1)

      if (sourcePhase === destPhase) {
        newSourceExerciseIds.splice(destination.index, 0, draggableId)
        updateWorkout({
          ...currentWorkout,
          phases: {
            ...currentWorkout.phases,
            [sourcePhase]: {
              ...currentWorkout.phases[sourcePhase],
              exerciseIds: newSourceExerciseIds,
            },
          },
        })
      } else {
        const newDestExerciseIds = Array.from(currentWorkout.phases[destPhase].exerciseIds)
        newDestExerciseIds.splice(destination.index, 0, draggableId)
        updateWorkout({
          ...currentWorkout,
          phases: {
            ...currentWorkout.phases,
            [sourcePhase]: {
              ...currentWorkout.phases[sourcePhase],
              exerciseIds: newSourceExerciseIds,
            },
            [destPhase]: {
              ...currentWorkout.phases[destPhase],
              exerciseIds: newDestExerciseIds,
            },
          },
        })
      }
    }
  }

  const handleDeleteWorkout = () => {
    if (selectedWorkout) {
      deleteWorkout(selectedWorkout)
      setSelectedWorkout(null)
    }
  }

  const handleEditExercise = () => {
    if (editingExercise) {
      updateExercise(editingExercise)
      setEditingExercise(null)
      setIsEditDialogOpen(false)
    }
  }

  const renderExerciseItem = (exercise: any, isDraggable = true) => {
    const draggableProps = isDraggable
      ? {
          draggableId: exercise.id,
          index: exercises.findIndex((e) => e.id === exercise.id),
        }
      : {}

    const content = (
      <div className="bg-white p-2 mb-2 rounded flex items-center justify-between">
        <span>
          {exercise.name}: {exercise.sets} x {exercise.reps}
        </span>
        <div className="flex space-x-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setEditingExercise(exercise)}>
                <Edit2Icon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upravit cvik</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Název
                  </Label>
                  <Input
                    id="name"
                    value={editingExercise?.name || ""}
                    onChange={(e) => setEditingExercise((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sets" className="text-right">
                    Série
                  </Label>
                  <Input
                    id="sets"
                    type="number"
                    value={editingExercise?.sets || 0}
                    onChange={(e) =>
                      setEditingExercise((prev) => (prev ? { ...prev, sets: Number.parseInt(e.target.value) } : null))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reps" className="text-right">
                    Opakování
                  </Label>
                  <Input
                    id="reps"
                    type="number"
                    value={editingExercise?.reps || 0}
                    onChange={(e) =>
                      setEditingExercise((prev) => (prev ? { ...prev, reps: Number.parseInt(e.target.value) } : null))
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleEditExercise}>Uložit změny</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Opravdu chcete smazat tento cvik?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tato akce je nevratná. Cvik bude odstraněn {isDraggable ? "ze seznamu cviků" : "z tréninku"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    isDraggable
                      ? deleteExercise(exercise.id)
                      : removeExerciseFromWorkout(currentWorkout!.id, exercise.id)
                  }
                >
                  Smazat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {isDraggable ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (currentWorkout) {
                  updateWorkout({
                    ...currentWorkout,
                    phases: {
                      ...currentWorkout.phases,
                      [selectedPhase]: {
                        ...currentWorkout.phases[selectedPhase],
                        exerciseIds: [...currentWorkout.phases[selectedPhase].exerciseIds, exercise.id],
                      },
                    },
                  })
                }
              }}
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => removeExerciseFromWorkout(currentWorkout!.id, exercise.id)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )

    return isDraggable ? (
      <Draggable key={exercise.id} {...draggableProps}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
            {content}
          </div>
        )}
      </Draggable>
    ) : (
      content
    )
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
          <CardTitle>Upravit trénink</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <select
              className="w-full p-2 border rounded"
              value={selectedWorkout || ""}
              onChange={(e) => setSelectedWorkout(e.target.value)}
            >
              <option value="">Vyberte trénink</option>
              {workouts.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.name}
                </option>
              ))}
            </select>
            {selectedWorkout && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Smazat
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Opravdu chcete smazat tento trénink?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tato akce je nevratná. Trénink bude odstraněn ze všech dnů v týdenním plánu.
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
            <>
              <div className="mb-4">
                <Label>Vyberte fázi tréninku:</Label>
                <select
                  className="w-full p-2 border rounded mt-1"
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value as "warmup" | "main" | "cooldown")}
                >
                  <option value="warmup">Rozehřátí</option>
                  <option value="main">Trénink</option>
                  <option value="cooldown">Dopumpování</option>
                </select>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex space-x-4 items-start">
                  <Droppable droppableId="available">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="w-1/2 bg-gray-100 p-4 rounded min-h-[200px]"
                      >
                        <h3 className="font-bold mb-2">Dostupné cviky</h3>
                        {availableExercises.map((exercise) => renderExerciseItem(exercise))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <Droppable droppableId={`${selectedPhase}-exercises`}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="w-1/2 bg-gray-100 p-4 rounded min-h-[200px]"
                      >
                        <h3 className="font-bold mb-2">
                          Cviky v tréninku ({currentWorkout?.phases[selectedPhase].name})
                        </h3>
                        {currentWorkout?.phases[selectedPhase].exerciseIds.map((exerciseId) => {
                          const exercise = exercises.find((e) => e.id === exerciseId)
                          if (!exercise) return null
                          return renderExerciseItem(exercise, false)
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </DragDropContext>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

