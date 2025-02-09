import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, Square, AlertTriangle, ArrowDown, ChevronRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SetType } from '@/types/exercise'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

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
}

export function SetDetail({ set, setIndex, onClick }: SetDetailProps) {
  const [isMobileView, setIsMobileView] = useState(false);
  const dragId = `set-${setIndex}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dragId,
  });

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 640);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: !isDragging ? 'transform 250ms ease' : undefined,
  };

  const MobileSetContent = () => (
    <div className="flex items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Série {setIndex + 1}</span>
          {set.type === SetType.REST_PAUSE && (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          {set.type === SetType.DROP && (
            <ArrowDown className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}
          {set.type === SetType.REST_PAUSE && set.restPauseSeconds && (
            <span className="ml-2">(pauza {set.restPauseSeconds}s)</span>
          )}
          {set.type === SetType.DROP && set.dropSets && (
            <span className="ml-2">
              → {set.dropSets.map(drop => `${drop.weight}kg`).join(' → ')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {set.isCompleted ? (
          <CheckSquare className="w-5 h-5 text-primary" />
        ) : (
          <div className="flex items-center text-muted-foreground">
            <span className="text-sm mr-1">Swipe</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );

  if (isMobileView) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`
          p-3 rounded-lg border mb-2 
          ${set.isCompleted ? 'bg-primary/5 border-primary' : 'bg-card border-border'}
          relative
          touch-pan-x
        `}
      >
        <MobileSetContent />
        {/* Swipe indikátor na pozadí */}
        <div 
          className="absolute inset-0 bg-green-100 rounded-lg -z-10 flex items-center justify-end pr-4"
          style={{
            opacity: transform?.x ? Math.min(transform.x / 200, 1) : 0
          }}
        >
          <CheckSquare className="w-6 h-6 text-green-600" />
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
              <Square className="w-4 h-4" />
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
          <p>{set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}</p>
          {set.type === SetType.REST_PAUSE && set.restPauseSeconds && (
            <p>Pauza: {set.restPauseSeconds}s</p>
          )}
          {set.type === SetType.DROP && set.dropSets && (
            set.dropSets.map((drop, i) => (
              <p key={i}>Drop {i + 1}: {drop.weight}kg × {drop.reps}</p>
            ))
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
