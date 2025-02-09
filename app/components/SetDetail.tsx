import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, AlertTriangle, ArrowDown, XIcon } from "lucide-react"
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
}

export function SetDetail({ set, setIndex, onClick }: SetDetailProps) {
  const [isMobileView, setIsMobileView] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkIfMobile = () => setIsMobileView(window.innerWidth < 640);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    const bounded = Math.max(Math.min(diff, 150), -150);
    setSwipeX(bounded);
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeX) > 100) {
      onClick();
    }
    setSwipeX(0);
  };

  const MobileSetContent = () => (
    <>
      <div className="flex items-center gap-2 mb-1">
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
    </>
  );

  if (isMobileView) {
    return (
      <div className="relative mb-4 min-h-[80px]">
        {/* Pozadí pro feedback */}
        <div 
          className={`
            absolute inset-0 rounded-lg flex items-center justify-center
            ${swipeX > 0 ? 'bg-green-100' : swipeX < 0 ? 'bg-red-100' : ''}
          `}
          style={{
            opacity: Math.abs(swipeX) / 100
          }}
        >
          {swipeX > 0 ? (
            <CheckSquare className="w-8 h-8 text-green-600" />
          ) : (
            <XIcon className="w-8 h-8 text-red-600" />
          )}
        </div>

        {/* Karta */}
        <div
          ref={cardRef}
          className={`
            absolute inset-0 p-4 rounded-lg border bg-background
            ${set.isCompleted ? 'border-primary' : 'border-border'}
          `}
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: swipeX === 0 ? 'transform 0.2s ease-out' : undefined
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <MobileSetContent />
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
