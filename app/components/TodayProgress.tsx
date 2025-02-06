"use client"

import { useWorkout } from "@/contexts/WorkoutContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { cs } from "date-fns/locale"

function CurrentDate() {
  return (
    <div className="text-muted-foreground">
      {format(new Date(), "EEEE d. MMMM yyyy", { locale: cs })}
    </div>
  )
}

export function TodayProgress() {
  const { activeWorkout } = useWorkout()
  
  // Pokud není aktivní trénink, vrátíme 0%
  const progress = activeWorkout?.progress || 0

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Dnešní progres</CardTitle>
          <CurrentDate />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-end text-sm text-muted-foreground">
            {Math.round(progress)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
