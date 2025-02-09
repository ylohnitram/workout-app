import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, AlertTriangle, ArrowDown, XIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SetType } from '@/types/exercise'
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

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

  useEffect(() => {
    const checkIfMobile = () => setIsMobileView(window.innerWidth < 640);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const [{ x, rotate }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    config: { tension: 300, friction: 20 }
  }));

  const bind = useDrag(({ active, movement: [mx], direction: [xDir], cancel }) => {
    // Pokud je swipe dost dlouhý, provedeme akci
    if (!active && Math.abs(mx) > 100) {
      const isRight = mx > 0;
      // Dokončíme animaci do strany
      api.start({
        x: isRight ? 500 : -500,
        rotate: isRight ? 45 : -45,
        onResolve: () => {
          onClick();
          // Po dokončení akce vrátíme kartu do původní pozice
          api.start({ x: 0, rotate: 0 });
        }
      });
    } else {
      // Jinak animujeme podle pohybu prstu
      api.start({
        x: active ? mx : 0,
        rotate: active ? mx / 20 : 0,
        immediate: active
      });
    }
  }, {
    from: () => [x.get(), 0],
    filterTaps: true,
    bounds: { left: -200, right: 200 },
    rubberband: true
  });

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
    const isSwipingRight = x.to(value => value > 0);
    const swipeProgress = x.to(value => Math.min(Math.abs(value) / 100, 1));

    return (
      <div className="relative mb-4 touch-none h-24">
        {/* Pozadí pro feedback */}
        <animated.div
          className="absolute inset-0 rounded-lg flex items-center justify-center overflow-hidden"
          style={{
            opacity: swipeProgress,
            backgroundColor: isSwipingRight.to(right => 
              right ? 'rgb(220, 252, 231)' : 'rgb(254, 226, 226)'
            )
          }}
        >
          <animated.div
            style={{
              opacity: swipeProgress,
              scale: swipeProgress.to(p => 0.8 + p * 0.2),
              color: isSwipingRight.to(right => 
                right ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)'
              )
            }}
          >
            {isSwipingRight.to(right => 
              right ? <CheckSquare className="w-8 h-8" /> : <XIcon className="w-8 h-8" />
            )}
          </animated.div>
        </animated.div>

        {/* Hlavní karta */}
        <animated.div
          {...bind()}
          style={{
            x,
            rotate,
            touchAction: 'none'
          }}
          className={`
            absolute inset-0 p-4 rounded-lg border bg-background
            ${set.isCompleted ? 'border-primary' : 'border-border'}
            cursor-grab active:cursor-grabbing
          `}
        >
          <MobileSetContent />
        </animated.div>
      </div>
    );
  }

  // Desktop verze zůstává stejná...
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
