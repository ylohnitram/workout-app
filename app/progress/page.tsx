"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkout } from "@/contexts/WorkoutContext"
import WorkoutProgress from "@/app/components/WorkoutProgress"

export default function ProgressPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Průběh tréninku</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Zpět na dashboard
        </button>
      </div>
      <WorkoutProgress />
    </div>
  )
}
