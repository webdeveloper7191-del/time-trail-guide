import { DemandData, Room } from '@/types/roster';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react';
import { useDemand } from '@/contexts/DemandContext';

interface DemandHistogramProps {
  demandData: DemandData[];
  room: Room;
  date: string;
  isCompact?: boolean;
}

export function DemandHistogram({ demandData, room, date, isCompact = false }: DemandHistogramProps) {
  const { settings, getThresholdForDemand, getActivePatterns, getDemandWithMultiplier } = useDemand();
  
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

  // Get threshold colors from settings
  const getBarColor = (percentage: number) => {
    if (!settings.enabled) {
      // Fallback to default colors
      if (percentage >= 90) return 'bg-emerald-500';
      if (percentage >= 70) return 'bg-amber-500';
      if (percentage >= 50) return 'bg-blue-400';
      return 'bg-muted-foreground/30';
    }
    
    const demand = Math.round((percentage / 100) * maxCapacity);
    const threshold = getThresholdForDemand(demand);
    if (threshold) {
      return `bg-[${threshold.color}]`;
    }
    return 'bg-muted-foreground/30';
  };

  const getBarStyle = (percentage: number, slot: string) => {
    const demand = Math.round((percentage / 100) * maxCapacity);
    const threshold = getThresholdForDemand(demand);
    const patterns = getActivePatterns(date, slot);
    
    return {
      height: `${Math.max(percentage, 10)}%`,
      backgroundColor: threshold?.color || (
        percentage >= 90 ? '#22c55e' :
        percentage >= 70 ? '#f59e0b' :
        percentage >= 50 ? '#60a5fa' :
        'rgba(156, 163, 175, 0.3)'
      ),
      borderLeft: patterns.length > 0 ? `2px solid ${patterns[0].color}` : undefined,
    };
  };

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
                    className="w-1.5 rounded-sm transition-all"
                    style={getBarStyle(percentage, slot)}
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
              settings={settings}
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
              <span className="text-[10px] font-medium text-muted-foreground">
                {settings.enabled ? 'Demand' : 'Demand'}
              </span>
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
                const patterns = getActivePatterns(date, slot);
                
                return (
                  <div key={slot} className="flex-1 flex flex-col items-center gap-0.5">
                    <div 
                      className="relative w-full h-6 bg-muted rounded-sm overflow-hidden"
                      style={{ borderLeft: patterns.length > 0 ? `2px solid ${patterns[0].color}` : undefined }}
                    >
                      {/* Booked (background) */}
                      <div
                        className="absolute bottom-0 w-full transition-all"
                        style={{ 
                          height: `${bookedPercent}%`,
                          backgroundColor: getBarStyle(bookedPercent, slot).backgroundColor,
                          opacity: 0.3,
                        }}
                      />
                      {/* Historical attendance (foreground) */}
                      <div
                        className="absolute bottom-0 w-full transition-all"
                        style={{ 
                          height: `${attendancePercent}%`,
                          backgroundColor: getBarStyle(bookedPercent, slot).backgroundColor,
                        }}
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
            settings={settings}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { DemandMasterSettings } from '@/types/industryConfig';

function DemandTooltipContent({ 
  avgUtilization, 
  peakChildren, 
  avgAttendance, 
  capacity,
  settings,
}: { 
  avgUtilization: number; 
  peakChildren: number; 
  avgAttendance: number;
  capacity: number;
  settings?: DemandMasterSettings;
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
        <span className="text-xs font-medium">{avgAttendance}</span>
      </div>
      {settings?.display.showForecast && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Forecast</span>
          <span className="text-xs font-medium text-primary">Enabled</span>
        </div>
      )}
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
