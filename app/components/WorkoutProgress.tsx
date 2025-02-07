"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorkout } from "@/contexts/WorkoutContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Timer } from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { SetDetail } from './SetDetail'
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

  if (!activeWorkout) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Žádný aktivní trénink</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/')}
          >
            Zpět na dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  const handleSetToggle = (exerciseIndex: number, setIndex: number) => {
    const exercise = activeWorkout?.exercises[exerciseIndex];
    const set = exercise?.sets[setIndex];
    
    if (!set) return;

    completeSet(exerciseIndex, setIndex, {
      weight: set.weight,
      reps: typeof set.reps === 'number' ? set.reps : undefined
    });

    // Dialog pro ukončení zobrazíme pouze pokud jsme sérii označili jako dokončenou
    // a celkový progres je 100%
    if (!set.isCompleted && activeWorkout?.progress === 100) {
      setShowEndDialog(true);
    }
  };

  const handleEndWorkout = async () => {
    try {
      await endWorkout();
      setShowEndDialog(false);
      router.push('/');
    } catch (error) {
      console.error('Failed to end workout:', error);
    }
  };

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
                    <SetDetail
                      key={setIndex}
                      set={set}
                      setIndex={setIndex}
                      onClick={() => handleSetToggle(exerciseIndex, setIndex)}
                    />
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
        <DialogContent aria-describedby="workout-end-description">
          <DialogHeader>
            <DialogTitle>Ukončit trénink?</DialogTitle>
            <DialogDescription id="workout-end-description">
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
    </>
  );
}
