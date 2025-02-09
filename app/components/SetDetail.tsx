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

  // Funkce pro správné zobrazení váhy u drop série
  const getSetWeight = () => {
    if (set.type === SetType.DROP && set.dropSets && set.dropSets.length > 0) {
      // Vždy bereme první váhu z drop série místo 0
      return set.dropSets[0].weight;
    }
    return set.weight;
  };

  // Funkce pro zobrazení celého řetězce drop sérií
  const getDropSetText = () => {
    if (!set.dropSets || !set.dropSets.length) return '';

    if (isHistory) {
      // V historii zobrazíme celý řetězec na jednom řádku
      return `${set.dropSets.map(drop => `${drop.weight}kg`).join(' → ')}`;
    } else {
      // V aktivním tréninku zobrazíme první váhu a pak šipky s dalšími vahami
      const dropWeights = set.dropSets.slice(1);
      return dropWeights.length > 0 ? 
        ` → ${dropWeights.map(drop => `${drop.weight}kg`).join(' → ')}` : '';
    }
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
        </div>
        <div className="text-sm text-muted-foreground">
          {getSetWeight()}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}
          {set.type === SetType.REST_PAUSE && set.restPauseSeconds && (
            <span className="ml-2">(pauza {set.restPauseSeconds}s)</span>
          )}
          {set.type === SetType.DROP && (
            <span className="ml-2">{getDropSetText()}</span>
          )}
        </div>
      </div>
    );
  }

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
          <p>{getSetWeight()}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}</p>
          {set.type === SetType.REST_PAUSE && set.restPauseSeconds && (
            <p>Pauza: {set.restPauseSeconds}s</p>
          )}
          {set.type === SetType.DROP && (
            <p>{getDropSetText()}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
