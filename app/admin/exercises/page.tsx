# app/admin/exercises/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, PlusCircle, Edit2Icon, Trash2Icon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface Exercise {
  _id?: string;
  name: string;
  category?: string;
  description?: string;
  videoUrl?: string;
  muscleGroups?: string[];
}

const CATEGORIES = [
  "Prsa",
  "Záda",
  "Ramena",
  "Biceps",
  "Triceps",
  "Nohy",
  "Břicho",
  "Kardio"
];

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quadriceps",
  "hamstrings",
  "calves",
  "abs",
] as const;

export default function AdminExercises() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch exercises
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
          const data = await response.json();
          setExercises(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [user]);

  // Handle form submission
  const handleSubmit = async (exercise: Exercise) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const url = exercise._id 
        ? `/api/admin/exercises/${exercise._id}`
        : '/api/admin/exercises';
      
      const response = await fetch(url, {
        method: exercise._id ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exercise)
      });

      if (response.ok) {
        const result = await response.json();
        if (exercise._id) {
          setExercises(exercises.map(e => 
            e._id === exercise._id ? result : e
          ));
        } else {
          setExercises([...exercises, result]);
        }
        setEditingExercise(null);
      }
    } catch (error) {
      console.error('Failed to save exercise:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle exercise deletion
  const handleDelete = async (id: string) => {
    if (!user || !confirm('Opravdu chcete smazat tento cvik?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/exercises/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setExercises(exercises.filter(e => e._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Správa systémových cviků</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nový cvik
            </Button>
          </DialogTrigger>
          <DialogContent>
            <ExerciseForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {exercises.map((exercise) => (
          <Card key={exercise._id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <h3 className="font-semibold">{exercise.name}</h3>
                {exercise.category && (
                  <p className="text-sm text-gray-500">{exercise.category}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit2Icon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <ExerciseForm
                      exercise={exercise}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => exercise._id && handleDelete(exercise._id)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ExerciseForm({ 
  exercise,
  onSubmit,
  isSubmitting 
}: { 
  exercise?: Exercise;
  onSubmit: (exercise: Exercise) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<Exercise>(
    exercise || {
      name: "",
      category: "",
      description: "",
      videoUrl: "",
      muscleGroups: []
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {exercise ? 'Upravit cvik' : 'Nový cvik'}
        </DialogTitle>
        <DialogDescription>
          Vyplňte detaily cviku. Pole označená * jsou povinná.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="block mb-2">
            Název cviku *
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>
        </div>

        <div>
          <label className="block mb-2">
            Kategorie
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte kategorii" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <div>
          <label className="block mb-2">
            Popis
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </label>
        </div>

        <div>
          <label className="block mb-2">
            YouTube URL
            <Input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
