import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, AlertTriangle, ArrowDown } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SetType } from '@/types/exercise'

interface SetDetailProps {
  set: {
    type: SetType;
    weight: number;
    reps: number | 'failure';
    isCompleted: boolean;
    restPauseSeconds?: number;
    dropSets?: Array<{
      weight: number;
      reps?: number;
    }>;
  };
  setIndex: number;
  onClick: () => void;
  isHistory?: boolean;
}

export function SetDetail({ set, setIndex, onClick, isHistory = false }: SetDetailProps) {
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobileView(window.innerWidth < 640);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Funkce pro zobrazení textu série včetně všech detailů
  const getSetDescription = () => {
    const baseText = `${set.weight}kg × ${set.reps === 'failure' ? 'do selhání' : set.reps}`;
    
    if (set.type === SetType.REST_PAUSE && set.restPauseSeconds) {
      return `${baseText} (rest-pause ${set.restPauseSeconds}s)`;
    }
    
    if (set.type === SetType.DROP && set.dropSets?.length) {
      const dropSequence = set.dropSets.map(drop => `${drop.weight}kg`).join(' → ');
      return `${dropSequence}`;
    }
    
    return baseText;
  };

  if (isMobileView) {
    return (
      <div className="border rounded-lg p-4 mb-2 bg-background">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Série {setIndex + 1}</span>
            {set.type === SetType.REST_PAUSE && (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            {set.type === SetType.DROP && (
              <ArrowDown className="w-4 h-4 text-red-500" />
            )}
          </div>
          {!isHistory && (
            <Button
              variant={set.isCompleted ? "default" : "outline"}
              size="sm"
              onClick={onClick}
            >
              {set.isCompleted ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 border rounded" />
              )}
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {getSetDescription()}
          {isHistory && set.actualWeight && set.actualReps && (
            <div className="mt-1 text-xs text-muted-foreground">
              Skutečně: {set.actualWeight}kg × {set.actualReps}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop verze s tooltipem
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={set.isCompleted ? "default" : "outline"}
            size="sm"
            onClick={onClick}
            className="relative flex items-center gap-1"
          >
            {set.isCompleted ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <span className="w-4 h-4 border rounded" />
            )}
            <span>Série {setIndex + 1}</span>
            {set.type === SetType.REST_PAUSE && (
              <AlertTriangle className="w-4 h-4 text-yellow-500 ml-1" />
            )}
            {set.type === SetType.DROP && (
              <ArrowDown className="w-4 h-4 text-red-500 ml-1" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>{getSetDescription()}</p>
            {isHistory && set.actualWeight && set.actualReps && (
              <p className="text-xs text-muted-foreground">
                Skutečně: {set.actualWeight}kg × {set.actualReps}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
