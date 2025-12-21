import { ChevronRight, Navigation, Clock } from 'lucide-react';

interface Step {
  distance: number;
  duration: number;
  instruction: string;
  name?: string;
}

interface DirectionsPanelProps {
  distance: number;
  duration: number;
  steps: Step[];
  isLoading?: boolean;
}

export function DirectionsPanel({ distance, duration, steps, isLoading }: DirectionsPanelProps) {
  const distanceKm = (distance / 1000).toFixed(1);
  const durationMins = Math.round(duration / 60);

  return (
    <div className="glass-panel rounded-2xl shadow-lg max-h-80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center gap-3">
        <Navigation className="w-5 h-5" />
        <div>
          <div className="font-bold text-sm">Next destination</div>
          <div className="text-xs opacity-90">{distanceKm} km • {durationMins} min</div>
        </div>
      </div>

      {/* Steps List */}
      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            Loading directions...
          </div>
        ) : steps.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No directions available
          </div>
        ) : (
          steps.slice(0, 5).map((step, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {step.instruction}
                  {step.name && ` on ${step.name}`}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{(step.distance / 1000).toFixed(2)} km</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{Math.round(step.duration / 60)} min</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
