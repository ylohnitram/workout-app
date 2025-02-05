"use client"

import { useState, useEffect } from "react"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckSquare, Square, Timer, X } from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function WorkoutProgress() {
  const { activeWorkout, completeSet, endWorkout } = useWorkout()
  const [showSetDialog, setShowSetDialog] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null)
  const [selectedSet, setSelectedSet] = useState<number | null>(null)
  const [actualWeight, setActualWeight] = useState<string>("")
  const [actualReps, setActualReps] = useState<string>("")
  const [timer, setTimer] = useState<number>(0)
  const [showEndDialog, setShowEndDialog] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeWorkout) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000);
        setTimer(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeWorkout]);

  const handleSetClick = (exerciseIndex: number, setIndex: number) => {
    const exercise = activeWorkout?.exercises[exerciseIndex];
    const set = exercise?.sets[setIndex];
    
    if (set?.isCompleted || !exercise) return;

    setSelectedExercise(exerciseIndex);
    setSelectedSet(setIndex);
    setActualWeight(set.weight.toString());
    setActualReps(typeof set.reps === 'number' ? set.reps.toString() : "");
    setShowSetDialog(true);
  };

  const handleSetComplete = () => {
    if (selectedExercise === null || selectedSet === null) return;

    completeSet(selectedExercise, selectedSet, {
      weight: Number(actualWeight),
      reps: Number(actualReps)
    });

    setShowSetDialog(false);
    setSelectedExercise(null);
    setSelectedSet(null);
    setActualWeight("");
    setActualReps("");

    // Pokud jsme dosáhli 100% progresu, zobrazíme dialog pro ukončení
    if (activeWorkout?.progress === 100) {
      setShowEndDialog(true);
    }
  };

  if (!activeWorkout) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            Žádný aktivní trénink
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Probíhající trénink</CardTitle>
          <div className="flex items-center space-x-2 text-lg font-mono">
            <Timer className="w-5 h-5" />
            <span>{formatTime(timer)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Celkový progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Celkový průběh</span>
              <span>{Math.round(activeWorkout.progress)}%</span>
            </div>
            <Progress value={activeWorkout.progress} />
          </div>

          {/* Seznam cviků */}
          <div className="space-y-4">
            {activeWorkout.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{exercise.name}</h3>
                  <span className="text-sm text-gray-500">
                    {Math.round(exercise.progress)}%
                  </span>
                </div>
                
                <Progress value={exercise.progress} className="mb-2" />
                
                <div className="flex flex-wrap gap-2">
                  {exercise.sets.map((set, setIndex) => (
                    <Button
                      key={setIndex}
                      variant={set.isCompleted ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetClick(exerciseIndex, setIndex)}
                      disabled={set.isCompleted}
                      className="relative"
                    >
                      {set.isCompleted ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      
                      {set.isCompleted && (
                        <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1">
                          {set.actualReps || set.reps}×{set.actualWeight || set.weight}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => setShowEndDialog(true)}
          >
            Ukončit trénink
          </Button>
        </CardContent>
      </Card>

      {/* Dialog pro zadání výkonu série */}
      <Dialog open={showSetDialog} onOpenChange={setShowSetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokončit sérii</DialogTitle>
            <DialogDescription>
              Zadejte skutečné hodnoty pro tuto sérii
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Váha (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reps">Počet opakování</Label>
              <Input
                id="reps"
                type="number"
                value={actualReps}
                onChange={(e) => setActualReps(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetDialog(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSetComplete}>
              Potvrdit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pro ukončení tréninku */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ukončit trénink?</DialogTitle>
            <DialogDescription>
              {activeWorkout.progress < 100 
                ? "Trénink není dokončen. Opravdu jej chcete ukončit?"
                : "Gratulujeme k dokončení tréninku!"}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Zrušit
            </Button>
            <Button 
              variant={activeWorkout.progress === 100 ? "default" : "destructive"}
              onClick={async () => {
                await endWorkout();
                setShowEndDialog(false);
              }}
            >
              Ukončit trénink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
