"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useWorkout } from "@/contexts/WorkoutContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const ADMIN_EMAILS = ['mholy1983@gmail.com']

export function Navbar() {
  const { user, signOut } = useAuth()
  const { activeWorkout } = useWorkout()
  const router = useRouter()

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">Workout Tracker</h1>
            <button 
              onClick={() => router.push('/')}
              className="hover:text-gray-600"
            >
              Dashboard
            </button>
            {activeWorkout && (
              <button 
                onClick={() => router.push('/progress')}
                className="hover:text-gray-600 text-green-600 font-semibold"
              >
                Aktivní trénink
              </button>
            )}
            <button 
              onClick={() => router.push('/exercises')}
              className="hover:text-gray-600"
            >
              Moje cviky
            </button>
            {isAdmin && (
              <button 
                onClick={() => router.push('/admin/exercises')}
                className="hover:text-gray-600"
              >
                Správa systémových cviků
              </button>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span>{user.email}</span>
              <Button onClick={signOut}>Odhlásit se</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
