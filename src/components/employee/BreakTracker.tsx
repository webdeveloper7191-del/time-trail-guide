import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, Play, Square, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface BreakRecord {
  id: string;
  startTime: Date;
  endTime: Date | null;
  durationSeconds: number;
  type: 'lunch' | 'short';
}

interface BreakTrackerProps {
  isClockedIn: boolean;
  onBreakStateChange: (isOnBreak: boolean) => void;
  onBreaksUpdate: (breaks: BreakRecord[], totalBreakSeconds: number) => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function BreakTracker({ isClockedIn, onBreakStateChange, onBreaksUpdate }: BreakTrackerProps) {
  const [breaks, setBreaks] = useState<BreakRecord[]>([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakElapsed, setBreakElapsed] = useState(0);

  // Timer for active break
  useEffect(() => {
    if (!isOnBreak) return;
    const interval = setInterval(() => {
      setBreakElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOnBreak]);

  // Reset when clocked out
  useEffect(() => {
    if (!isClockedIn) {
      setBreaks([]);
      setIsOnBreak(false);
      setBreakElapsed(0);
    }
  }, [isClockedIn]);

  const totalBreakSeconds = breaks.reduce((sum, b) => sum + b.durationSeconds, 0) + (isOnBreak ? breakElapsed : 0);

  const startBreak = useCallback((type: 'lunch' | 'short') => {
    const newBreak: BreakRecord = {
      id: `brk-${Date.now()}`,
      startTime: new Date(),
      endTime: null,
      durationSeconds: 0,
      type,
    };
    setBreaks(prev => [...prev, newBreak]);
    setIsOnBreak(true);
    setBreakElapsed(0);
    onBreakStateChange(true);
    toast.info(`${type === 'lunch' ? 'Lunch' : 'Short'} break started`);
  }, [onBreakStateChange]);

  const endBreak = useCallback(() => {
    const now = new Date();
    setBreaks(prev => {
      const updated = prev.map((b, i) =>
        i === prev.length - 1 && !b.endTime
          ? { ...b, endTime: now, durationSeconds: breakElapsed }
          : b
      );
      const total = updated.reduce((sum, b) => sum + b.durationSeconds, 0);
      onBreaksUpdate(updated, total);
      return updated;
    });
    setIsOnBreak(false);
    setBreakElapsed(0);
    onBreakStateChange(false);
    toast.success(`Break ended — ${formatDuration(breakElapsed)} recorded`);
  }, [breakElapsed, onBreakStateChange, onBreaksUpdate]);

  if (!isClockedIn) return null;

  const completedBreaks = breaks.filter(b => b.endTime);

  return (
    <div className="flex items-center gap-3">
      {/* Break status / controls */}
      {isOnBreak ? (
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-100 text-amber-700 border-0 gap-1 animate-pulse">
            <Coffee className="h-3 w-3" />
            Break {formatDuration(breakElapsed)}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={endBreak}
          >
            <Square className="h-3 w-3 fill-current" /> End Break
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-amber-700"
            onClick={() => startBreak('short')}
          >
            <Coffee className="h-3 w-3" /> Short Break
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-amber-700"
            onClick={() => startBreak('lunch')}
          >
            <Coffee className="h-3.5 w-3.5" /> Lunch
          </Button>
        </div>
      )}

      {/* Break summary */}
      {completedBreaks.length > 0 && !isOnBreak && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {completedBreaks.length} break{completedBreaks.length > 1 ? 's' : ''} • {formatDuration(totalBreakSeconds)} total
        </span>
      )}
    </div>
  );
}
