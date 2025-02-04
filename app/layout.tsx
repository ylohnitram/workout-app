import { AuthProvider } from "../contexts/AuthContext"
import { Navbar } from "@/components/Navbar"
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workout Tracker',
  description: 'Track your workouts and progress',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
