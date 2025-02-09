import { AuthProvider } from "@/contexts/AuthContext"
import { WorkoutProvider } from "@/contexts/WorkoutContext"
import { Navbar } from "@/components/Navbar"
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workout Tracker',
  description: 'Track your workouts and progress',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body>
        <AuthProvider>
          <WorkoutProvider>
            <Navbar />
            {children}
            <Toaster richColors position="top-center" />
          </WorkoutProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
