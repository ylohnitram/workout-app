"use client"

import { useState } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Edit2Icon, Trash2Icon, CheckIcon, XIcon } from "lucide-react"
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

export default function ExerciseList() {
  const { selectedWorkout } = useWorkout()
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editSets, setEditSets] = useState("")
  const [editReps, setEditReps] = useState("")

  if (!selectedWorkout) {
    return <div>Vyberte trénink pro zobrazení cviků</div>
  }

  const handleEditStart = (exercise: { id: string; name: string; sets: number; reps: number }) => {
    setEditingExercise(exercise.id)
    setEditName(exercise.name)
    setEditSets(exercise.sets.toString())
    setEditReps(exercise.reps.toString())
  }

  const handleEditSave = (id: string) => {
    // Implementation of handleEditSave
    setEditingExercise(null)
  }

  const handleEditCancel = () => {
    setEditingExercise(null)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ul className="space-y-4">
          {selectedWorkout.exercises.map((exercise, index) => (
            <li key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded">
              {editingExercise === exercise.id ? (
                <>
                  <div className="flex-grow mr-2">
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mb-2"
                      placeholder="Název cviku"
                    />
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        value={editSets}
                        onChange={(e) => setEditSets(e.target.value)}
                        placeholder="Série"
                      />
                      <Input
                        type="number"
                        value={editReps}
                        onChange={(e) => setEditReps(e.target.value)}
                        placeholder="Opakování"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleEditSave(exercise.id)} size="icon" variant="outline">
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleEditCancel} size="icon" variant="outline">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span>
                    {exercise.name}: {exercise.sets} x {exercise.reps}
                  </span>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleEditStart(exercise)} size="icon" variant="outline">
                      <Edit2Icon className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Opravdu chcete smazat tento cvik?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tato akce je nevratná. Cvik bude odstraněn ze všech tréninků.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Zrušit</AlertDialogCancel>
                          <AlertDialogAction>Smazat</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </li>
          ))}
          {selectedWorkout.exercises.length === 0 && (
            <div>Tento trénink zatím nemá žádné cviky</div>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}

