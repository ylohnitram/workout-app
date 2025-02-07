"use client"

import { useEffect, useState } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format, startOfDay, endOfDay } from "date-fns"
import { cs } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Calendar, Timer } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface WorkoutLog {
  _id: string;
  workoutId: string;
  startTime: Date;
  endTime: Date;
  exercises: any[];
}

export function DailyWorkoutStatus() {
  const { activeWorkout, workouts } = useWorkout()
  const { user } = useAuth()
  const router = useRouter()
  const [todayWorkoutLog, setTodayWorkoutLog] = useState<WorkoutLog | null>(null)
  const today = format(new Date(), "EEEE d. MMMM yyyy", { locale: cs })
  const currentDayName = format(new Date(), "EEEE", { locale: cs }).toLowerCase()

  // Načtení workoutLogu pro dnešní den
  useEffect(() => {
    const fetchTodayLog = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken()
        const startDate = startOfDay(new Date())
        const endDate = endOfDay(new Date())
        
        const response = await fetch(
          `/api/workout-logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (response.ok) {
          const { data } = await response.json()
          if (data && data.length > 0) {
            setTodayWorkoutLog(data[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch today workout log:', error)
      }
    }

    fetchTodayLog()
  }, [user])

  // Kontrola jestli je na dnešek naplánovaný trénink
  const fetchWeekPlan = async () => {
    if (!user) return null;
    
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/week-plan', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { data } = await response.json()
        const todayPlan = data.dayPlans.find((plan: any) => 
          plan.day.toLowerCase() === currentDayName
        )
        if (todayPlan && todayPlan.workoutId) {
          return workouts.find(w => w._id === todayPlan.workoutId)
        }
      }
    } catch (error) {
      console.error('Failed to fetch week plan:', error)
    }
    return null
  }

  const [plannedWorkout, setPlannedWorkout] = useState<any>(null)

  useEffect(() => {
    fetchWeekPlan().then(workout => setPlannedWorkout(workout))
  }, [currentDayName, workouts])

  if (activeWorkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            <span>{today}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-green-600 font-semibold">Probíhá trénink</p>
            <Button 
              onClick={() => router.push('/progress')}
              className="w-full"
            >
              Pokračovat v tréninku
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (todayWorkoutLog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>{today}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-blue-600 font-semibold">Trénink dokončen</p>
            <Button 
              variant="outline"
              onClick={() => router.push(`/workout-log/${todayWorkoutLog._id}`)}
              className="w-full"
            >
              Zobrazit detail tréninku
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span>{today}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {plannedWorkout ? (
          <div className="space-y-2">
            <p>Na dnešek máte naplánovaný trénink:</p>
            <p className="font-medium">{plannedWorkout.name}</p>
            <Button 
              onClick={() => router.push(`/workout/${plannedWorkout._id}`)}
              className="w-full"
            >
              Zahájit trénink
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Na dnešní den nemáte naplánovaný žádný trénink
          </p>
        )}
      </CardContent>
    </Card>
  )
}
