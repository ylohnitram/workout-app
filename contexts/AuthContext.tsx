"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, signInWithPopup, signOut as firebaseSignOut, type AuthError } from "firebase/auth"
import { auth, googleProvider } from "../lib/firebase"

interface AuthContextType {
  user: User | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        console.log("User authenticated:", user.email)
      } else {
        console.log("No user authenticated")
      }
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      console.log("Sign in successful:", result.user.email)
    } catch (error) {
      console.error("Error signing in with Google:", error)
      const authError = error as AuthError
      let errorMessage = "Failed to sign in with Google. Please try again."
      if (authError.code === "auth/configuration-not-found") {
        errorMessage = "Firebase configuration error. Please check your setup and environment variables."
      }
      setError(errorMessage)
      throw error
    }
  }

  const signOut = async () => {
    try {
      localStorage.clear();  // Vyčistíme localStorage před odhlášením
      await firebaseSignOut(auth)
      console.log("Sign out successful")
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Failed to sign out. Please try again.")
    }
  }

  return <AuthContext.Provider value={{ user, signInWithGoogle, signOut, error }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
