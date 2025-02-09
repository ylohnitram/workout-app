import { useEffect, useState } from "react"
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
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

const SWIPE_THRESHOLD = 100; // Počet pixelů pro dokončení swipu

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function WorkoutProgress() {
  const router = useRouter();
  const { activeWorkout, completeSet, endWorkout } = useWorkout();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [timer, setTimer] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimální vzdálenost pro aktivaci swipe
        tolerance: 5, // Tolerance pro šikmý pohyb
        delay: 0, // Žádné zpoždění pro aktivaci
      },
    })
  );

  useEffect(() => {
    if (!activeWorkout) {
      router.push('/');
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000);
      setTimer(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout, router]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!active || !active.id || typeof active.id !== 'string') return;

    // Pokud byl swipe dostatečně dlouhý, označíme sérii jako dokončenou
    if (Math.abs(delta.x) > SWIPE_THRESHOLD) {
      const setId = active.id as string;
      // Předpokládáme formát ID: "exercise-{exerciseIndex}-set-{setIndex}"
      const match = setId.match(/^set-(\d+)$/);
      if (match) {
        const setIndex = parseInt(match[1], 10);
        const exerciseIndex = activeWorkout.exercises.findIndex(exercise => 
          exercise.sets.some((_, idx) => idx === setIndex)
        );
        
        if (exerciseIndex !== -1) {
          completeSet(exerciseIndex, setIndex);
        }
      }
    }
  };

  if (!activeWorkout) return null;

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
            <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
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
                        onClick={() => completeSet(exerciseIndex, setIndex)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </DndContext>
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
              onClick={async () => {
                await endWorkout();
                setShowEndDialog(false);
                router.push('/');
              }}
            >
              Ukončit trénink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
