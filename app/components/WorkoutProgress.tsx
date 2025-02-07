"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Timer, CheckSquare, Square, AlertTriangle, ArrowDown, Info } from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SetType } from '@/types/exercise'
import { useState } from "react"

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function WorkoutProgress() {
  const router = useRouter();
  const { activeWorkout, completeSet, endWorkout } = useWorkout()
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [timer, setTimer] = useState<number>(0)

  // Pokud není aktivní trénink, přesměrujeme na dashboard
  useEffect(() => {
    if (!activeWorkout) {
      router.push('/')
    }
  }, [activeWorkout, router]);

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

  if (!activeWorkout) {
    return null;
  }

  const handleSetToggle = (exerciseIndex: number, setIndex: number) => {
    const exercise = activeWorkout?.exercises[exerciseIndex];
    const set = exercise?.sets[setIndex];
    
    if (!set) return;

    completeSet(exerciseIndex, setIndex, {
      weight: set.weight,
      reps: typeof set.reps === 'number' ? set.reps : undefined
    });

    // Pokud jsme dosáhli 100% progresu, zobrazíme dialog pro ukončení
    if (activeWorkout?.progress === 100) {
      setShowEndDialog(true);
    }
  };

  const handleEndWorkout = async () => {
    await endWorkout();
    setShowEndDialog(false);
    router.push('/'); // Po ukončení tréninku přesměrujeme na dashboard
  };

  return (
    <TooltipProvider>
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
                    <div key={setIndex} className="flex items-center">
                      <Button
                        variant={set.isCompleted ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSetToggle(exerciseIndex, setIndex)}
                        className="relative flex items-center gap-1"
                      >
                        {set.isCompleted ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        <span>Série {setIndex + 1}</span>
                        
                        {/* Ikony pro speciální typy sérií */}
                        {set.type === SetType.REST_PAUSE && (
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div>
                                <AlertTriangle className="w-4 h-4 text-yellow-500 ml-1" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rest-pause série</p>
                              {set.restPauseSeconds && (
                                <p>Pauza: {set.restPauseSeconds}s</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {set.type === SetType.DROP && (
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div>
                                <ArrowDown className="w-4 h-4 text-red-500 ml-1" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Drop série</p>
                              {set.dropSets && set.dropSets.map((drop, i) => (
                                <p key={i}>Drop {i + 1}: {drop.weight}kg × {drop.reps}</p>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {/* Info o sérii */}
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div>
                              <Info className="w-4 h-4 ml-1" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Button>
                    </div>
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
              onClick={handleEndWorkout}
            >
              Ukončit trénink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
