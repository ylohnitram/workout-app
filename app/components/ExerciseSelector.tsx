"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, MinusCircle, Dumbbell } from "lucide-react"
import { SetType, Exercise } from '@/types/exercise'

interface DropSet {
 weight: number;
 reps: number;
}

interface ExerciseSet {
 type: SetType;
 weight: number;
 reps: number | 'failure';
 restPauseSeconds?: number;
 dropSets?: DropSet[];
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
     // Reset specific fields based on type
     restPauseSeconds: type === SetType.REST_PAUSE ? 5 : undefined,
     dropSets: type === SetType.DROP ? [{ weight: 0, reps: 0 }] : undefined
   }
   setSets(newSets)
 }

 const handleSetChange = (index: number, field: keyof ExerciseSet, value: any) => {
   const newSets = [...sets]
   newSets[index] = { ...newSets[index], [field]: value }
   setSets(newSets)
 }

 const handleAddDropSet = (setIndex: number) => {
   const newSets = [...sets]
   newSets[setIndex].dropSets = [
     ...(newSets[setIndex].dropSets || []),
     { weight: 0, reps: 0 }
   ]
   setSets(newSets)
 }

 const handleDropSetChange = (setIndex: number, dropIndex: number, field: keyof DropSet, value: number) => {
   const newSets = [...sets]
   if (newSets[setIndex].dropSets) {
     newSets[setIndex].dropSets![dropIndex] = {
       ...newSets[setIndex].dropSets![dropIndex],
       [field]: value
     }
   }
   setSets(newSets)
 }

 const handleSubmit = () => {
   if (!selectedExerciseId) return
   onExerciseAdd(selectedExerciseId, isSystemExercise, sets)
   // Reset form
   setSelectedExerciseId("")
   setSets([{ type: SetType.NORMAL, weight: 0, reps: 0 }])
 }

 return (
   <Card>
     <CardHeader>
       <CardTitle>Přidat cvik do tréninku</CardTitle>
     </CardHeader>
     <CardContent>
       <Tabs defaultValue="system" onValueChange={(value) => setIsSystemExercise(value === "system")}>
         <TabsList>
           <TabsTrigger value="system">Systémové cviky</TabsTrigger>
           <TabsTrigger value="user">Moje cviky</TabsTrigger>
         </TabsList>
         
         <TabsContent value="system">
           <Select
             value={selectedExerciseId}
             onValueChange={setSelectedExerciseId}
           >
             <SelectTrigger>
               <SelectValue placeholder="Vyberte cvik" />
             </SelectTrigger>
             <SelectContent>
               {systemExercises.map((exercise) => (
                 <SelectItem key={exercise._id} value={exercise._id}>
                   {exercise.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </TabsContent>
         
         <TabsContent value="user">
           <Select
             value={selectedExerciseId}
             onValueChange={setSelectedExerciseId}
           >
             <SelectTrigger>
               <SelectValue placeholder="Vyberte cvik" />
             </SelectTrigger>
             <SelectContent>
               {userExercises.map((exercise) => (
                 <SelectItem key={exercise._id} value={exercise._id}>
                   {exercise.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </TabsContent>
       </Tabs>

       {selectedExerciseId && (
         <div className="mt-4 space-y-4">
           {sets.map((set, setIndex) => (
             <div key={setIndex} className="border p-4 rounded-lg">
               <div className="flex justify-between items-center mb-2">
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

               <div className="grid grid-cols-2 gap-4 mb-2">
                 <div>
                   <Select
                     value={set.type}
                     onValueChange={(value) => handleSetTypeChange(setIndex, value as SetType)}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Typ série" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value={SetType.NORMAL}>Normální</SelectItem>
                       <SelectItem value={SetType.DROP}>Drop série</SelectItem>
                       <SelectItem value={SetType.REST_PAUSE}>Rest-pause</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div>
                   <Select
                     value={set.reps.toString()}
                     onValueChange={(value) => handleSetChange(setIndex, 'reps', value === 'failure' ? 'failure' : parseInt(value))}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Počet opakování" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="failure">Do selhání</SelectItem>
                       {Array.from({length: 30}, (_, i) => (
                         <SelectItem key={i + 1} value={(i + 1).toString()}>
                           {i + 1}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <Input
                 type="number"
                 placeholder="Váha (kg)"
                 value={set.weight || ""}
                 onChange={(e) => handleSetChange(setIndex, 'weight', parseFloat(e.target.value))}
                 className="mb-2"
               />

               {set.type === SetType.REST_PAUSE && (
                 <Input
                   type="number"
                   placeholder="Délka pauzy (s)"
                   value={set.restPauseSeconds || ""}
                   onChange={(e) => handleSetChange(setIndex, 'restPauseSeconds', parseInt(e.target.value))}
                 />
               )}

               {set.type === SetType.DROP && set.dropSets && (
                 <div className="mt-2 space-y-2">
                   {set.dropSets.map((dropSet, dropIndex) => (
                     <div key={dropIndex} className="grid grid-cols-2 gap-2">
                       <Input
                         type="number"
                         placeholder="Váha (kg)"
                         value={dropSet.weight || ""}
                         onChange={(e) => handleDropSetChange(setIndex, dropIndex, 'weight', parseFloat(e.target.value))}
                       />
                       <Input
                         type="number"
                         placeholder="Počet opakování"
                         value={dropSet.reps || ""}
                         onChange={(e) => handleDropSetChange(setIndex, dropIndex, 'reps', parseInt(e.target.value))}
                       />
                     </div>
                   ))}
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleAddDropSet(setIndex)}
                     className="w-full"
                   >
                     <PlusCircle className="h-4 w-4 mr-2" />
                     Přidat drop
                   </Button>
                 </div>
               )}
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

             <Button
               onClick={handleSubmit}
             >
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
