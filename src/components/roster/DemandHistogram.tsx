import { DemandData, Room } from '@/types/roster';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react';

interface DemandHistogramProps {
  demandData: DemandData[];
  room: Room;
  date: string;
  isCompact?: boolean;
}

export function DemandHistogram({ demandData, room, date, isCompact = false }: DemandHistogramProps) {
  const dayDemand = demandData.filter(d => d.date === date && d.roomId === room.id);
  
  if (dayDemand.length === 0) return null;

  const timeSlots = ['06:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00'];
  const maxCapacity = room.capacity;

  const avgUtilization = Math.round(
    dayDemand.reduce((sum, d) => sum + d.utilisationPercent, 0) / dayDemand.length
  );
  const peakChildren = Math.max(...dayDemand.map(d => d.bookedChildren));
  const avgAttendance = Math.round(
    dayDemand.reduce((sum, d) => sum + d.historicalAttendance, 0) / dayDemand.length
  );

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex gap-0.5 h-4">
              {timeSlots.map((slot) => {
                const slotData = dayDemand.find(d => d.timeSlot === slot);
                const percentage = slotData ? (slotData.bookedChildren / maxCapacity) * 100 : 0;
                
                return (
                  <div
                    key={slot}
                    className={cn(
                      "w-1.5 rounded-sm transition-all",
                      percentage >= 90 && "bg-emerald-500",
                      percentage >= 70 && percentage < 90 && "bg-amber-500",
                      percentage >= 50 && percentage < 70 && "bg-blue-400",
                      percentage < 50 && "bg-muted-foreground/30"
                    )}
                    style={{ height: `${Math.max(percentage, 10)}%` }}
                  />
                );
              })}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="w-48">
            <DemandTooltipContent 
              avgUtilization={avgUtilization}
              peakChildren={peakChildren}
              avgAttendance={avgAttendance}
              capacity={maxCapacity}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-muted/50 rounded-md p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">Demand</span>
              <div className="flex items-center gap-1">
                {avgUtilization >= 80 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : avgUtilization < 50 ? (
                  <TrendingDown className="h-3 w-3 text-amber-500" />
                ) : null}
                <span className={cn(
                  "text-[10px] font-semibold",
                  avgUtilization >= 80 && "text-emerald-600",
                  avgUtilization >= 50 && avgUtilization < 80 && "text-foreground",
                  avgUtilization < 50 && "text-amber-600"
                )}>
                  {avgUtilization}%
                </span>
              </div>
            </div>
            
            <div className="flex items-end gap-1 h-8">
              {timeSlots.map((slot) => {
                const slotData = dayDemand.find(d => d.timeSlot === slot);
                const bookedPercent = slotData ? (slotData.bookedChildren / maxCapacity) * 100 : 0;
                const attendancePercent = slotData ? (slotData.historicalAttendance / maxCapacity) * 100 : 0;
                
                return (
                  <div key={slot} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="relative w-full h-6 bg-muted rounded-sm overflow-hidden">
                      {/* Booked (background) */}
                      <div
                        className={cn(
                          "absolute bottom-0 w-full transition-all",
                          bookedPercent >= 90 && "bg-emerald-500/30",
                          bookedPercent >= 70 && bookedPercent < 90 && "bg-amber-500/30",
                          bookedPercent < 70 && "bg-blue-400/30"
                        )}
                        style={{ height: `${bookedPercent}%` }}
                      />
                      {/* Historical attendance (foreground) */}
                      <div
                        className={cn(
                          "absolute bottom-0 w-full transition-all",
                          bookedPercent >= 90 && "bg-emerald-500",
                          bookedPercent >= 70 && bookedPercent < 90 && "bg-amber-500",
                          bookedPercent < 70 && "bg-blue-400"
                        )}
                        style={{ height: `${attendancePercent}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground">
                      {slot.split('-')[0].slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
              <span>Peak: {peakChildren}</span>
              <span>Avg: {avgAttendance}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-56">
          <DemandTooltipContent 
            avgUtilization={avgUtilization}
            peakChildren={peakChildren}
            avgAttendance={avgAttendance}
            capacity={maxCapacity}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DemandTooltipContent({ 
  avgUtilization, 
  peakChildren, 
  avgAttendance, 
  capacity 
}: { 
  avgUtilization: number; 
  peakChildren: number; 
  avgAttendance: number;
  capacity: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Avg Utilization</span>
        <span className={cn(
          "text-xs font-semibold",
          avgUtilization >= 80 && "text-emerald-500",
          avgUtilization < 50 && "text-amber-500"
        )}>
          {avgUtilization}%
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Peak Bookings</span>
        <span className="text-xs font-medium">{peakChildren} / {capacity}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Historical Avg</span>
        <span className="text-xs font-medium">{avgAttendance} children</span>
      </div>
      <div className="pt-1 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          {avgUtilization >= 80 
            ? "High demand - ensure adequate staffing"
            : avgUtilization < 50
            ? "Low demand - consider reducing staffing"
            : "Moderate demand - standard staffing recommended"
          }
        </p>
      </div>
    </div>
  );
}
