"use client"

import { useState } from "react"
import { useWorkout } from "../../contexts/WorkoutContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AddExercise() {
  const { addExercise } = useWorkout()
  const [name, setName] = useState("")
  const [sets, setSets] = useState("")
  const [reps, setReps] = useState("")

  const handleAddExercise = () => {
    if (name && sets && reps) {
      addExercise({
        id: Date.now().toString(),
        name,
        sets: Number.parseInt(sets),
        reps: Number.parseInt(reps),
      })
      setName("")
      setSets("")
      setReps("")
    }
  }

  return (
    <div className="space-y-4">
      <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Název cviku" />
      <Input type="number" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="Počet sérií" />
      <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Počet opakování" />
      <Button onClick={handleAddExercise}>Přidat cvik</Button>
    </div>
  )
}

