"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import WeekPlanner from "./components/WeekPlanner"
import WorkoutEditor from "./components/WorkoutEditor"
import WorkoutExecution from "./components/WorkoutExecution"
import WorkoutHistory from "./components/WorkoutHistory"
import { DailyWorkoutStatus } from "./components/DailyWorkoutStatus"

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Plánovač silového tréninku</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <DailyWorkoutStatus />
          <div>
            <h2 className="text-2xl font-semibold mb-4">Týdenní plán</h2>
            <WeekPlanner />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Historie tréninků</h2>
            <WorkoutHistory />
          </div>
        </div>

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
