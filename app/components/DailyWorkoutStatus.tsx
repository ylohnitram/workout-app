"use client"

import { useWorkout } from "@/contexts/WorkoutContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function DailyWorkoutStatus() {
  const { activeWorkout } = useWorkout()
  const router = useRouter()
  const today = format(new Date(), "EEEE d. MMMM yyyy", { locale: cs })

  if (activeWorkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dnešní den - {today}</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dnešní den - {today}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Zatím nemáte dokončený žádný trénink
        </p>
      </CardContent>
    </Card>
  )
}
