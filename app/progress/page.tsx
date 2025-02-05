"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkout } from "@/contexts/WorkoutContext"
import WorkoutProgress from "@/app/components/WorkoutProgress"

export default function ProgressPage() {
  const { user } = useAuth()
  const { activeWorkout } = useWorkout()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (!activeWorkout) {
      router.push("/")
    }
  }, [user, activeWorkout, router])

  if (!user || !activeWorkout) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Průběh tréninku</h1>
      <WorkoutProgress />
    </div>
  )
}
