"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DragOverlay, useDraggable } from "@dnd-kit/core"

interface Exercise {
  _id: string;
  name: string;
  category?: string;
}

function DraggableExercise({ exercise }: { exercise: Exercise }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: exercise._id,
    data: exercise
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 bg-white rounded border border-gray-200 cursor-move hover:bg-gray-50"
    >
      {exercise.name}
      {exercise.category && (
        <span className="ml-2 text-sm text-gray-500">({exercise.category})</span>
      )}
    </div>
  );
}

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchExercises = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/exercises', {
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
      }
    };

    fetchExercises();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knihovna cviků</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {exercises.map((exercise) => (
            <DraggableExercise key={exercise._id} exercise={exercise} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
