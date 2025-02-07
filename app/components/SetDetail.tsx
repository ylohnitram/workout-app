"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, Square, AlertTriangle, ArrowDown, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SetType } from '@/types/exercise'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    onClick();
    setIsOpen(false);
  };

  // Komponenta pro detail série na mobilu
  const MobileDetail = () => (
    <div className="p-4 space-y-2">
      <p className="font-medium">Série {setIndex + 1}</p>
      <p>{set.weight}kg × {set.reps === 'failure' ? 'do selhání' : set.reps}</p>
      {set.type === SetType.REST_PAUSE && set.restPauseSeconds && (
        <p>Rest-pause pauza: {set.restPauseSeconds}s</p>
      )}
      {set.type === SetType.DROP && set.dropSets && (
        <div className="space-y-1">
          <p className="font-medium">Drop série:</p>
          {set.dropSets.map((drop, i) => (
            <p key={i}>Drop {i + 1}: {drop.weight}kg × {drop.reps || '?'}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop verze s tooltipem */}
      <div className="hidden sm:block">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
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
                <Info className="w-4 h-4 ml-1" />
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
      </div>

      {/* Mobilní verze s bottomsheet */}
      <div className="sm:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant={set.isCompleted ? "default" : "outline"}
              size="sm"
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
              <Info className="w-4 h-4 ml-1" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Detail série</SheetTitle>
              <MobileDetail />
              <Button onClick={handleClick} className="w-full mt-4">
                {set.isCompleted ? 'Zrušit sérii' : 'Dokončit sérii'}
              </Button>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
