import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckSquare, Square, AlertTriangle, ArrowDown } from "lucide-react"
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 640); // 640px je hranice pro sm: v Tailwindu
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleClick = () => {
    onClick();
    setIsSheetOpen(false);
  };

  const MobileSetContent = () => (
    <div className="flex flex-col space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Série {setIndex + 1}</h3>
          <span className={set.isCompleted ? "text-green-600" : "text-gray-500"}>
            {set.isCompleted ? "Dokončeno" : "Nedokončeno"}
          </span>
        </div>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Váha:</span>
            <span className="font-medium">{set.weight} kg</span>
          </div>
          <div className="flex justify-between">
            <span>Opakování:</span>
            <span className="font-medium">
              {set.reps === 'failure' ? 'Do selhání' : set.reps}
            </span>
          </div>
          
          {set.type === SetType.REST_PAUSE && set.restPauseSeconds && (
            <div className="flex justify-between text-yellow-600">
              <span>Rest-pause:</span>
              <span className="font-medium">{set.restPauseSeconds}s</span>
            </div>
          )}
        </div>

        {set.type === SetType.DROP && set.dropSets && (
          <div className="border-t pt-2 mt-2">
            <h4 className="font-medium mb-2">Drop série</h4>
            <div className="space-y-2">
              {set.dropSets.map((drop, idx) => (
                <div key={idx} className="flex justify-between bg-muted p-2 rounded">
                  <span>Drop {idx + 1}:</span>
                  <span className="font-medium">{drop.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Společný button pro obě verze
  const SetButton = ({ onClick }: { onClick?: () => void }) => (
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
  );

  if (isMobileView) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <SetButton />
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] sm:h-[40vh]">
          <SheetHeader>
            <SheetTitle>Detail série</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            <MobileSetContent />
          </div>
          <SheetFooter className="mt-4">
            <Button 
              onClick={handleClick}
              variant={set.isCompleted ? "destructive" : "default"}
              className="w-full"
            >
              {set.isCompleted ? 'Zrušit sérii' : 'Dokončit sérii'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <SetButton onClick={onClick} />
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
