import React, { useState, useMemo } from 'react';
import { 
  Combine, Users, Clock, ArrowRight, Check, X, Undo2,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Room, DemandData } from '@/types/roster';
import { CombineAlert, CombiningPlan, DEFAULT_TIME_BLOCKS, TimeBlock } from '@/lib/areaCombiningEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';

interface AreaCombiningTimelineProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  demandData: DemandData[];
  alerts: CombineAlert[];
  combiningPlans: CombiningPlan[];
  date: string;
  centreId: string;
  onCreatePlan: (alert: CombineAlert) => void;
  onRemovePlan: (planId: string) => void;
}

const ageGroupColors: Record<string, string> = {
  nursery: 'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-300',
  toddler: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300',
  preschool: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300',
  kindy: 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300',
};

const ageGroupLabels: Record<string, string> = {
  nursery: 'Nursery',
  toddler: 'Toddler',
  preschool: 'Pre-School',
  kindy: 'Kindy',
};

function getUtilColor(pct: number): string {
  if (pct <= 25) return 'bg-red-400 dark:bg-red-500';
  if (pct <= 50) return 'bg-amber-400 dark:bg-amber-500';
  if (pct <= 75) return 'bg-blue-400 dark:bg-blue-500';
  return 'bg-green-400 dark:bg-green-500';
}

function getUtilTextColor(pct: number): string {
  if (pct <= 25) return 'text-red-700 dark:text-red-400';
  if (pct <= 50) return 'text-amber-700 dark:text-amber-400';
  if (pct <= 75) return 'text-blue-700 dark:text-blue-400';
  return 'text-green-700 dark:text-green-400';
}

export function AreaCombiningTimeline({
  open,
  onClose,
  rooms,
  demandData,
  alerts,
  combiningPlans,
  date,
  centreId,
  onCreatePlan,
  onRemovePlan,
}: AreaCombiningTimelineProps) {
  const centreRooms = useMemo(() => rooms.filter(r => r.centreId === centreId), [rooms, centreId]);
  const timeBlocks = DEFAULT_TIME_BLOCKS;

  // Build utilisation matrix: room x timeBlock
  const utilisationMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { attendance: number; capacity: number; pct: number; staffNeeded: number }>> = {};
    
    for (const room of centreRooms) {
      matrix[room.id] = {};
      for (const block of timeBlocks) {
        const demand = demandData.find(
          d => d.date === date && d.centreId === centreId && d.roomId === room.id && d.timeSlot === block.timeSlot
        );
        const attendance = demand?.bookedChildren ?? 0;
        const pct = room.capacity > 0 ? Math.round((attendance / room.capacity) * 100) : 0;
        matrix[room.id][block.id] = {
          attendance,
          capacity: room.capacity,
          pct,
          staffNeeded: Math.ceil(attendance / room.requiredRatio),
        };
      }
    }
    return matrix;
  }, [centreRooms, demandData, date, centreId, timeBlocks]);

  // Map alerts by time block for visual indicators
  const alertsByBlock = useMemo(() => {
    const map = new Map<string, CombineAlert[]>();
    for (const alert of alerts.filter(a => a.status === 'pending')) {
      const existing = map.get(alert.timeBlock.id) || [];
      existing.push(alert);
      map.set(alert.timeBlock.id, existing);
    }
    return map;
  }, [alerts]);

  // Map plans by time block
  const plansByBlock = useMemo(() => {
    const map = new Map<string, CombiningPlan[]>();
    for (const plan of combiningPlans) {
      const existing = map.get(plan.timeBlock.id) || [];
      existing.push(plan);
      map.set(plan.timeBlock.id, existing);
    }
    return map;
  }, [combiningPlans]);

  const totalStaffSavings = useMemo(() => 
    alerts.filter(a => a.status === 'pending').reduce((s, a) => s + a.staffSaved, 0),
    [alerts]
  );

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Room Combining Timeline"
      size="xl"
    >
      <div className="space-y-6 p-1">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{centreRooms.length}</div>
            <div className="text-xs text-muted-foreground">Active Rooms</div>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{alerts.filter(a => a.status === 'pending').length}</div>
            <div className="text-xs text-muted-foreground">Combine Suggestions</div>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStaffSavings}</div>
            <div className="text-xs text-muted-foreground">Potential Staff Savings</div>
          </div>
        </div>

        {/* Timeline grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid bg-muted/50" style={{ gridTemplateColumns: '140px repeat(4, 1fr)' }}>
            <div className="px-3 py-2 border-r border-b text-xs font-medium text-muted-foreground flex items-center">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Room
            </div>
            {timeBlocks.map(block => {
              const blockAlerts = alertsByBlock.get(block.id) || [];
              const blockPlans = plansByBlock.get(block.id) || [];
              return (
                <div key={block.id} className="px-3 py-2 border-r border-b text-center last:border-r-0">
                  <div className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    {block.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{block.startTime} – {block.endTime}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {blockAlerts.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-600 border-amber-300">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        {blockAlerts.length}
                      </Badge>
                    )}
                    {blockPlans.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 text-green-600 border-green-300">
                        <Combine className="h-2.5 w-2.5 mr-0.5" />
                        {blockPlans.length}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Room rows */}
          {centreRooms.map(room => (
            <div
              key={room.id}
              className="grid border-b last:border-b-0"
              style={{ gridTemplateColumns: '140px repeat(4, 1fr)' }}
            >
              {/* Room label */}
              <div className="px-3 py-2.5 border-r flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-8 rounded-full shrink-0',
                    ageGroupColors[room.ageGroup]?.split(' ')[0] || 'bg-gray-300'
                  )}
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{room.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {ageGroupLabels[room.ageGroup] || room.ageGroup} · Cap: {room.capacity}
                  </div>
                </div>
              </div>

              {/* Time block cells */}
              {timeBlocks.map(block => {
                const stats = utilisationMatrix[room.id]?.[block.id];
                if (!stats) return <div key={block.id} className="border-r last:border-r-0" />;

                const isCombined = combiningPlans.some(
                  p => p.timeBlock.id === block.id && p.sourceRoomIds.includes(room.id)
                );
                const isTarget = combiningPlans.some(
                  p => p.timeBlock.id === block.id && p.targetRoomId === room.id
                );
                const relevantAlert = alerts.find(
                  a => a.timeBlock.id === block.id && 
                  a.status === 'pending' &&
                  a.sourceRooms.some(r => r.roomId === room.id)
                );

                return (
                  <div
                    key={block.id}
                    className={cn(
                      'border-r last:border-r-0 p-2 relative transition-colors',
                      isCombined && 'bg-amber-50/50 dark:bg-amber-950/20',
                      isTarget && 'bg-green-50/50 dark:bg-green-950/20',
                      relevantAlert && !isCombined && 'bg-red-50/30 dark:bg-red-950/10',
                    )}
                  >
                    {/* Utilisation bar */}
                    <div className="mb-1.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn('text-[10px] font-semibold', getUtilTextColor(stats.pct))}>
                          {stats.pct}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {stats.attendance}/{stats.capacity}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', getUtilColor(stats.pct))}
                          style={{ width: `${Math.min(100, stats.pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Staff needed */}
                    <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {stats.staffNeeded} staff
                    </div>

                    {/* Combined indicator */}
                    {isCombined && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-600 border-amber-400">
                          <ArrowRight className="h-2.5 w-2.5 mr-0.5" />
                          Combined
                        </Badge>
                      </div>
                    )}

                    {isTarget && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-green-600 border-green-400">
                          <Combine className="h-2.5 w-2.5 mr-0.5" />
                          Target
                        </Badge>
                      </div>
                    )}

                    {/* Alert indicator with action */}
                    {relevantAlert && !isCombined && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onCreatePlan(relevantAlert)}
                              className="mt-1 w-full"
                            >
                              <Badge 
                                variant="outline" 
                                className="text-[10px] h-4 px-1 w-full justify-center cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 border-amber-400 transition-colors"
                              >
                                <Combine className="h-2.5 w-2.5 mr-0.5" />
                                Combine?
                              </Badge>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                            {relevantAlert.message}
                            <br />
                            <span className="text-green-600">Save {relevantAlert.staffSaved} staff</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Active combining plans */}
        {combiningPlans.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Combine className="h-4 w-4 text-green-600" />
              Active Combining Plans
            </h3>
            {combiningPlans.map(plan => {
              const sourceNames = plan.sourceRoomIds
                .map(id => rooms.find(r => r.id === id)?.name || id)
                .join(', ');
              const targetName = rooms.find(r => r.id === plan.targetRoomId)?.name || plan.targetRoomId;

              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {plan.timeBlock.label}
                    </Badge>
                    <span className="text-muted-foreground">{sourceNames}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{targetName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => onRemovePlan(plan.id)}
                  >
                    <Undo2 className="h-3 w-3 mr-1" />
                    Undo
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-full bg-red-400" /> 0-25%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-full bg-amber-400" /> 26-50%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-full bg-blue-400" /> 51-75%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-full bg-green-400" /> 76-100%
          </div>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
