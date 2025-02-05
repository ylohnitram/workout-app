"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2Icon, Edit2Icon, PlusCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const CATEGORIES = ["Prsa", "Záda", "Ramena", "Biceps", "Triceps", "Nohy", "Břicho", "Kardio"];

interface Exercise {
  _id?: string;
  name: string;
  category?: string;
  description?: string;
}

function ExerciseForm({ 
  exercise, 
  onSubmit, 
  onCancel 
}: { 
  exercise?: Exercise;
  onSubmit: (data: Exercise) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Exercise>(exercise || {
    name: "",
    category: "",
    description: ""
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Název cviku *</label>
        <Input
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kategorie</label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vyberte kategorii" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Popis</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Popis cviku, provedení, tipy..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Zrušit
        </Button>
        <Button type="submit">
          {exercise ? "Upravit" : "Přidat"} cvik
        </Button>
      </div>
    </form>
  );
}

export default function ExercisesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchExercises = async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/exercises', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setExercises(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch exercises:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExercises()
  }, [user, router])

  const handleAddExercise = async (exerciseData: Exercise) => {
    try {
      const token = await user!.getIdToken()
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exerciseData)
      })

      if (response.ok) {
        const newExercise = await response.json()
        setExercises([...exercises, newExercise])
        setShowAddDialog(false)
      }
    } catch (error) {
      console.error('Failed to add exercise:', error)
    }
  }

  const handleEditExercise = async (exerciseData: Exercise) => {
    if (!editingExercise?._id) return

    try {
      const token = await user!.getIdToken()
      const response = await fetch(`/api/exercises/${editingExercise._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exerciseData)
      })

      if (response.ok) {
        const updatedExercise = await response.json()
        setExercises(exercises.map(ex => 
          ex._id === updatedExercise._id ? updatedExercise : ex
        ))
        setEditingExercise(null)
      }
    } catch (error) {
      console.error('Failed to update exercise:', error)
    }
  }

  const handleDeleteExercise = async (id: string) => {
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setExercises(exercises.filter(ex => ex._id !== id))
      }
    } catch (error) {
      console.error('Failed to delete exercise:', error)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto p-4">Načítám...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Moje cviky</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Přidat cvik
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nový cvik</DialogTitle>
            </DialogHeader>
            <ExerciseForm
              onSubmit={handleAddExercise}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {exercises.map((exercise) => (
          <Card key={exercise._id}>
            <CardContent className="flex justify-between items-start p-4">
              <div>
                <h3 className="font-semibold">{exercise.name}</h3>
                {exercise.category && (
                  <p className="text-sm text-gray-500">{exercise.category}</p>
                )}
                {exercise.description && (
                  <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <Dialog open={editingExercise?._id === exercise._id} onOpenChange={(open) => !open && setEditingExercise(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditingExercise(exercise)}>
                      <Edit2Icon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upravit cvik</DialogTitle>
                    </DialogHeader>
                    <ExerciseForm
                      exercise={exercise}
                      onSubmit={handleEditExercise}
                      onCancel={() => setEditingExercise(null)}
                    />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
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
                      <AlertDialogAction onClick={() => handleDeleteExercise(exercise._id!)}>
                        Smazat
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
