"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, MinusCircle, Dumbbell } from "lucide-react"
import { Label } from "@/components/ui/label"
import { SetType } from '@/types/exercise'
import { cn } from "@/lib/utils"

interface ExerciseSet {
  type: SetType;
  weight: number;
  reps: number | 'failure';
  restPauseSeconds?: number;
  dropSets?: { weight: number }[];
}

interface Exercise {
  _id: string;
  name: string;
  category?: string;
  isSystem: boolean;
}

interface ExerciseSelectorProps {
  systemExercises: Exercise[];
  userExercises: Exercise[];
  onExerciseAdd: (exerciseId: string, isSystem: boolean, sets: ExerciseSet[]) => void;
}

export function ExerciseSelector({ systemExercises, userExercises, onExerciseAdd }: ExerciseSelectorProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("")
  const [isSystemExercise, setIsSystemExercise] = useState(true)
  const [sets, setSets] = useState<ExerciseSet[]>([
    { type: SetType.NORMAL, weight: 0, reps: 0 }
  ])

  const handleAddSet = () => {
    setSets([...sets, { type: SetType.NORMAL, weight: 0, reps: 0 }])
  }

  const handleRemoveSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index))
  }

  const handleSetTypeChange = (index: number, type: SetType) => {
    const newSets = [...sets]
    newSets[index] = {
      ...newSets[index],
      type,
      // Reset specifických polí podle typu
      restPauseSeconds: type === SetType.REST_PAUSE ? 5 : undefined,
      dropSets: type === SetType.DROP ? [{ weight: 0 }, { weight: 0 }] : undefined
    }
    setSets(newSets)
  }

  const handleSetChange = (index: number, field: keyof ExerciseSet, value: any) => {
    const newSets = [...sets];
    
    if (field === 'weight' || field === 'restPauseSeconds') {
      value = value === '' ? 0 : Number(value);
    }
    
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  }

  const handleDropSetsChange = (setIndex: number, count: number) => {
    const newSets = [...sets]
    const currentSet = newSets[setIndex]
    if (currentSet.type === SetType.DROP) {
      currentSet.dropSets = Array(count).fill(null).map((_, i) => (
        currentSet.dropSets?.[i] || { weight: 0 }
      ))
      setSets(newSets)
    }
  }

  const handleDropSetWeightChange = (setIndex: number, dropIndex: number, weight: number) => {
    const newSets = [...sets]
    const set = newSets[setIndex]
    if (set.type === SetType.DROP && set.dropSets) {
      set.dropSets[dropIndex].weight = weight
      setSets(newSets)
    }
  }

  const handleSubmit = () => {
    if (!selectedExerciseId) return
    onExerciseAdd(selectedExerciseId, isSystemExercise, sets)
    setSelectedExerciseId("")
    setSets([{ type: SetType.NORMAL, weight: 0, reps: 0 }])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Přidat cvik do tréninku</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="system" onValueChange={(value) => setIsSystemExercise(value === "system")} className="mb-6">
          <TabsList>
            <TabsTrigger value="system">Systémové cviky</TabsTrigger>
            <TabsTrigger value="user">Moje cviky</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system">
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte cvik" />
              </SelectTrigger>
              <SelectContent>
                {systemExercises.map((exercise) => (
                  <SelectItem key={exercise._id} value={exercise._id}>{exercise.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>
          
          <TabsContent value="user">
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte cvik" />
              </SelectTrigger>
              <SelectContent>
                {userExercises.map((exercise) => (
                  <SelectItem key={exercise._id} value={exercise._id}>{exercise.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>
        </Tabs>

        {selectedExerciseId && (
          <div className="space-y-6">
            {sets.map((set, setIndex) => (
              <div 
                key={setIndex} 
                className={cn(
                  "rounded-lg border p-4 space-y-4",
                  set.type === SetType.DROP && "border-red-200 bg-red-50",
                  set.type === SetType.REST_PAUSE && "border-yellow-200 bg-yellow-50"
                )}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Série {setIndex + 1}</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveSet(setIndex)}
                    disabled={sets.length === 1}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Typ série</Label>
                    <Select
                      value={set.type}
                      onValueChange={(value) => handleSetTypeChange(setIndex, value as SetType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SetType.NORMAL}>Normální</SelectItem>
                        <SelectItem value={SetType.DROP}>Drop série</SelectItem>
                        <SelectItem value={SetType.REST_PAUSE}>Rest-pause</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Počet opakování</Label>
                    <Select
                      value={set.reps.toString()}
                      onValueChange={(value) => handleSetChange(setIndex, 'reps', value === 'failure' ? 'failure' : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="failure">Do selhání</SelectItem>
                        {Array.from({length: 30}, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Váha (kg)</Label>
                    <Input
                      type="number"
                      value={set.weight || ""}
                      onChange={(e) => handleSetChange(setIndex, 'weight', e.target.value)}
                    />
                  </div>

                  {set.type === SetType.REST_PAUSE && (
                    <div className="grid gap-2">
                      <Label>Délka pauzy (sekund)</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="5"
                        value={set.restPauseSeconds || ""}
                        onChange={(e) => handleSetChange(setIndex, 'restPauseSeconds', e.target.value)}
                      />
                    </div>
                  )}

                  {set.type === SetType.DROP && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Počet drop setů (včetně první váhy)</Label>
                        <Select
                          value={set.dropSets?.length.toString()}
                          onValueChange={(value) => handleDropSetsChange(setIndex, parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4].map((count) => (
                              <SelectItem key={count} value={count.toString()}>{count}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {set.dropSets?.map((dropSet, dropIndex) => (
                        <div key={dropIndex} className="grid gap-2">
                          <Label>Váha {dropIndex + 1} (kg)</Label>
                          <Input
                            type="number"
                            value={dropSet.weight || ""}
                            onChange={(e) => handleDropSetWeightChange(setIndex, dropIndex, Number(e.target.value))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleAddSet}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Přidat sérii
              </Button>

              <Button onClick={handleSubmit}>
                <Dumbbell className="h-4 w-4 mr-2" />
                Přidat do tréninku
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
