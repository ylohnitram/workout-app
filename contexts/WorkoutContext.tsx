"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query } from "firebase/firestore"
import { db } from "../lib/firebase"

type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
}

type WorkoutExercise = Exercise & {
  completedSets: number
}

type WorkoutPhase = {
  name: string
  exerciseIds: string[]
}

type Workout = {
  id: string
  name: string
  phases: {
    warmup: WorkoutPhase
    main: WorkoutPhase
    cooldown: WorkoutPhase
  }
}

type ActiveWorkout = {
  workoutId: string
  exercises: WorkoutExercise[]
}

type WeekPlan = {
  [key: string]: string // day: workoutId
}

type WorkoutContextType = {
  exercises: Exercise[]
  workouts: Workout[]
  weekPlan: WeekPlan
  activeWorkout: ActiveWorkout | null
  addExercise: (exercise: Omit<Exercise, "id">) => void
  updateExercise: (exercise: Exercise) => void
  deleteExercise: (exerciseId: string) => void
  addWorkout: (workout: Omit<Workout, "id">) => void
  updateWorkout: (workout: Workout) => void
  deleteWorkout: (workoutId: string) => void
  updateWeekPlan: (day: string, workoutId: string) => void
  startWorkout: (workoutId: string) => void
  completeSet: (exerciseId: string) => void
  resetWorkout: () => void
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => void
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({})
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const exercisesQuery = query(collection(db, `users/${user.uid}/exercises`))
    const unsubscribeExercises = onSnapshot(exercisesQuery, (snapshot) => {
      const exercisesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Exercise)
      setExercises(exercisesData)
    })

    const workoutsQuery = query(collection(db, `users/${user.uid}/workouts`))
    const unsubscribeWorkouts = onSnapshot(workoutsQuery, (snapshot) => {
      const workoutsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Workout)
      setWorkouts(workoutsData)
    })

    const weekPlanRef = doc(db, `users/${user.uid}/weekPlan/current`)
    const unsubscribeWeekPlan = onSnapshot(weekPlanRef, (doc) => {
      if (doc.exists()) {
        setWeekPlan(doc.data() as WeekPlan)
      }
    })

    return () => {
      unsubscribeExercises()
      unsubscribeWorkouts()
      unsubscribeWeekPlan()
    }
  }, [user])

  const addExercise = async (exercise: Omit<Exercise, "id">) => {
    if (!user) return
    const newExerciseRef = doc(collection(db, `users/${user.uid}/exercises`))
    await setDoc(newExerciseRef, exercise)
  }

  const updateExercise = async (updatedExercise: Exercise) => {
    if (!user) return
    const exerciseRef = doc(db, `users/${user.uid}/exercises/${updatedExercise.id}`)
    await updateDoc(exerciseRef, updatedExercise)
  }

  const deleteExercise = async (exerciseId: string) => {
    if (!user) return
    const exerciseRef = doc(db, `users/${user.uid}/exercises/${exerciseId}`)
    await deleteDoc(exerciseRef)
  }

  const addWorkout = async (workout: Omit<Workout, "id">) => {
    if (!user) return
    const newWorkoutRef = doc(collection(db, `users/${user.uid}/workouts`))
    await setDoc(newWorkoutRef, workout)
  }

  const updateWorkout = async (updatedWorkout: Workout) => {
    if (!user) return
    const workoutRef = doc(db, `users/${user.uid}/workouts/${updatedWorkout.id}`)
    await updateDoc(workoutRef, updatedWorkout)
  }

  const deleteWorkout = async (workoutId: string) => {
    if (!user) return
    const workoutRef = doc(db, `users/${user.uid}/workouts/${workoutId}`)
    await deleteDoc(workoutRef)
  }

  const updateWeekPlan = async (day: string, workoutId: string) => {
    if (!user) return
    const weekPlanRef = doc(db, `users/${user.uid}/weekPlan/current`)
    await setDoc(weekPlanRef, { [day]: workoutId }, { merge: true })
  }

  const startWorkout = (workoutId: string) => {
    const workout = workouts.find((w) => w.id === workoutId)
    if (workout) {
      const allExerciseIds = [
        ...workout.phases.warmup.exerciseIds,
        ...workout.phases.main.exerciseIds,
        ...workout.phases.cooldown.exerciseIds,
      ]
      const workoutExercises: WorkoutExercise[] = allExerciseIds.map((id) => {
        const exercise = exercises.find((e) => e.id === id)
        return { ...exercise!, completedSets: 0 }
      })
      setActiveWorkout({ workoutId, exercises: workoutExercises })
    }
  }

  const completeSet = (exerciseId: string) => {
    if (activeWorkout) {
      setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((e) =>
          e.id === exerciseId && e.completedSets < e.sets ? { ...e, completedSets: e.completedSets + 1 } : e,
        ),
      })
    }
  }

  const resetWorkout = () => {
    setActiveWorkout(null)
  }

  const removeExerciseFromWorkout = (workoutId: string, exerciseId: string) => {
    setWorkouts(
      workouts.map((workout) => {
        if (workout.id === workoutId) {
          return {
            ...workout,
            phases: {
              warmup: {
                ...workout.phases.warmup,
                exerciseIds: workout.phases.warmup.exerciseIds.filter((id) => id !== exerciseId),
              },
              main: {
                ...workout.phases.main,
                exerciseIds: workout.phases.main.exerciseIds.filter((id) => id !== exerciseId),
              },
              cooldown: {
                ...workout.phases.cooldown,
                exerciseIds: workout.phases.cooldown.exerciseIds.filter((id) => id !== exerciseId),
              },
            },
          }
        }
        return workout
      }),
    )
  }

  return (
    <WorkoutContext.Provider
      value={{
        exercises,
        workouts,
        weekPlan,
        activeWorkout,
        addExercise,
        updateExercise,
        deleteExercise,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        updateWeekPlan,
        startWorkout,
        completeSet,
        resetWorkout,
        removeExerciseFromWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext)
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider")
  }
  return context
}

