import { Loader2, Route, Navigation, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsPanelProps {
  distanceDriven: number; // in km
  streetsVisited: number;
  totalStreets: number;
  isTracking: boolean;
  className?: string;
}

export function StatsPanel({ distanceDriven, streetsVisited, totalStreets, isTracking, className }: StatsPanelProps) {
  const percentage = totalStreets > 0 ? Math.round((streetsVisited / totalStreets) * 100) : 0;

  return (
    <div className={cn("glass-panel rounded-2xl p-4 w-full max-w-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {isTracking ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          ) : (
            <span className="h-3 w-3 rounded-full bg-slate-300"></span>
          )}
          Current Session
        </h3>
        <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-2 rounded-xl bg-secondary/50">
          <Route className="w-5 h-5 text-primary mb-1" />
          <span className="text-xl font-bold font-mono">{distanceDriven.toFixed(2)}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">km</span>
        </div>
        
        <div className="flex flex-col items-center p-2 rounded-xl bg-secondary/50">
          <Layers className="w-5 h-5 text-primary mb-1" />
          <span className="text-xl font-bold font-mono">{streetsVisited}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streets</span>
        </div>

        <div className="flex flex-col items-center p-2 rounded-xl bg-secondary/50">
          <Navigation className="w-5 h-5 text-primary mb-1" />
          <span className="text-xl font-bold font-mono">{percentage}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Area Coverage</span>
          <span>{streetsVisited} / {totalStreets}</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
