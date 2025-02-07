"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { cs } from "date-fns/locale"

interface WorkoutLog {
  _id: string;
  workoutId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  exercises: Array<{
    name: string;
    sets: Array<{
      type: string;
      weight: number;
      reps: number | 'failure';
      isCompleted: boolean;
      actualWeight?: number;
      actualReps?: number;
    }>;
  }>;
}

export default function WorkoutLogPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [log, setLog] = useState<WorkoutLog | null>(null)

  useEffect(() => {
    const fetchLog = async () => {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/workout-logs/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setLog(data)
        }
      } catch (error) {
        console.error('Failed to fetch workout log:', error)
      }
    }

    fetchLog()
  }, [user, params.id])

  if (!log) {
    return <div>Načítání...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Detail tréninku</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Zpět
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Základní informace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Datum: </span>
                {format(new Date(log.startTime), "d. MMMM yyyy", { locale: cs })}
              </p>
              <p>
                <span className="font-medium">Začátek: </span>
                {format(new Date(log.startTime), "HH:mm", { locale: cs })}
              </p>
              <p>
                <span className="font-medium">Konec: </span>
                {format(new Date(log.endTime), "HH:mm", { locale: cs })}
              </p>
              <p>
                <span className="font-medium">Délka: </span>
                {Math.floor(log.duration / 60)} minut
              </p>
            </div>
          </CardContent>
        </Card>

        {log.exercises.map((exercise, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>{exercise.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exercise.sets.map((set, j) => (
                  <div key={j} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span>Série {j + 1}</span>
                    <span className="text-right">
                      {set.actualWeight || set.weight}kg × {set.actualReps || set.reps}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
