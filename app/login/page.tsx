"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const { user, signInWithGoogle, error: authError } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      console.log("User is logged in, redirecting to home page")
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  const handleSignIn = async () => {
    setError(null)
    try {
      console.log("Attempting to sign in with Google")
      await signInWithGoogle()
    } catch (error: any) {
      console.error("Error in handleSignIn:", error)
      setError(error.message || "An unexpected error occurred")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 max-w-sm w-full bg-white shadow-md rounded-md">
        <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">Přihlášení do Plánovače tréninků</h1>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleSignIn} className="w-full">
          Přihlásit se pomocí Google
        </Button>
        <p className="mt-4 text-sm text-gray-600">
          Pokud se vyskytne chyba, zkontrolujte konzoli prohlížeče pro více informací.
        </p>
      </div>
    </div>
  )
}

