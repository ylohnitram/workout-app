import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, AlertTriangle, ArrowDown, ChevronRight, XIcon } from "lucide-react"
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
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 640);
    };

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
    // Omezíme swipe pouze doprava a maximálně do 100px
    const newX = Math.max(0, Math.min(diff, 100));
    setSwipeX(newX);
  };

  const handleTouchEnd = () => {
    // Pokud byl swipe dostatečně dlouhý, provedeme akci
    if (swipeX > 50) {
      onClick();
    }
    // Vždy vrátíme do původní pozice
    setSwipeX(0);
  };

  const MobileSetContent = () => (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col">
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
    </div>
  );

  if (isMobileView) {
    return (
      <div className="relative mb-8">
        {/* Indikátory pod kartou */}
        <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-6 text-sm">
          <div className="flex items-center text-red-500">
            <XIcon className="w-5 h-5 mr-1" />
            <span>Nehotovo</span>
          </div>
          <div className="flex items-center text-green-500">
            <span>Hotovo</span>
            <CheckSquare className="w-5 h-5 ml-1" />
          </div>
        </div>
        
        {/* Hlavní karta */}
        <div
          ref={elementRef}
          className={`
            p-3 rounded-lg border relative bg-background
            ${set.isCompleted ? 'border-primary' : 'border-border'}
            touch-pan-x
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
