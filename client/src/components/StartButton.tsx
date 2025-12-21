import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartButtonProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function StartButton({ active, onClick, disabled }: StartButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center justify-center h-16 w-16 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        active 
          ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/30" 
          : "bg-primary text-white hover:bg-primary/90 shadow-primary/30"
      )}
    >
      {active ? (
        <Square className="w-6 h-6 fill-current" />
      ) : (
        <Play className="w-8 h-8 fill-current ml-1" />
      )}
      
      {/* Ripple effect ring */}
      {active && (
        <span className="absolute inset-0 rounded-full border-2 border-destructive animate-ping opacity-75"></span>
      )}
    </button>
  );
}
