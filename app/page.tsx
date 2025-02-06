"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import WeekPlanner from "./components/WeekPlanner"
import WorkoutEditor from "./components/WorkoutEditor"
import WorkoutExecution from "./components/WorkoutExecution"
import WorkoutHistory from "./components/WorkoutHistory"
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

function TodayProgress({ value }: { value: number }) {
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
          <Progress value={value} />
          <div className="flex justify-end text-sm text-muted-foreground">
            {Math.round(value)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Plánovač silového tréninku</h1>
      
      {/* Grid layout pro responsivní zobrazení */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* První sloupec */}
        <div className="space-y-6">
          <TodayProgress value={75} />
          <div>
            <h2 className="text-2xl font-semibold mb-4">Týdenní plán</h2>
            <WeekPlanner />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Historie tréninků</h2>
            <WorkoutHistory />
          </div>
        </div>

        {/* Druhý sloupec */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Editor tréninku</h2>
            <WorkoutEditor />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Provádění tréninku</h2>
            <WorkoutExecution />
          </div>
        </div>
      </div>
    </div>
  )
}
