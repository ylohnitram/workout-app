import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function initializeFirebase() {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing. Please check your environment variables.")
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    const db = getFirestore(app)
    const auth = getAuth(app)
    const googleProvider = new GoogleAuthProvider()

    console.log("Firebase initialized successfully")
    return { app, db, auth, googleProvider }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    throw error
  }
}

const { app, db, auth, googleProvider } = initializeFirebase()

export { app, db, auth, googleProvider }

