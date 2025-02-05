"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import WeekPlanner from "./components/WeekPlanner"
import WorkoutEditor from "./components/WorkoutEditor"
import WorkoutExecution from "./components/WorkoutExecution"

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Plánovač silového tréninku</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Týdenní plán</h2>
          <WeekPlanner />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Editor tréninku</h2>
          <WorkoutEditor />
        </div>
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Provádění tréninku</h2>
          <WorkoutExecution />
        </div>
      </div>
    </div>
  )
}
