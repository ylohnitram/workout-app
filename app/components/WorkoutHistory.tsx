"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { IWorkoutLog } from "@/models/workoutLog"

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 
    ? `${hours}h ${minutes}m`
    : `${minutes}m`
}

export default function WorkoutHistory() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<IWorkoutLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/workout-logs?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setLogs(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch workout logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [user])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Zatím nemáte žádnou historii tréninků
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historie tréninků</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div 
              key={log._id} 
              className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {format(new Date(log.startTime), "d. MMMM yyyy", { locale: cs })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(log.startTime), "HH:mm", { locale: cs })} - {format(new Date(log.endTime), "HH:mm", { locale: cs })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatDuration(log.duration)}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.completedSets}/{log.totalSets} sérií
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {log.exercises.map((exercise, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span>{exercise.name}</span>
                      <span className="text-muted-foreground">
                        {exercise.sets.filter(s => s.isCompleted).length}/{exercise.sets.length} sérií
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
