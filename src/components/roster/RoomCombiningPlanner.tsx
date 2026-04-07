import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Combine, Users, Clock, ArrowRight, Check, X, Undo2,
  AlertTriangle, GripVertical, Plus, Minus, ShieldCheck,
  TrendingDown, Sparkles, RotateCcw, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Room, DemandData } from '@/types/roster';
import { CombineAlert, CombiningPlan, DEFAULT_TIME_BLOCKS, TimeBlock } from '@/lib/areaCombiningEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';

interface RoomCombiningPlannerProps {
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
  onSavePlans: (plans: MergeGroup[]) => void;
}

export interface MergeGroup {
  id: string;
  timeBlockId: string;
  roomIds: string[];
  targetRoomId: string;
}

interface DragState {
  roomId: string;
  sourceBlockId: string | null;
  sourceGroupId: string | null;
}

// Compute staff required
function staffNeeded(attendance: number, ratio: number): number {
  if (attendance <= 0) return 0;
  return Math.ceil(attendance / ratio);
}

function getUtilColor(pct: number): string {
  if (pct <= 25) return 'bg-red-400 dark:bg-red-500';
  if (pct <= 50) return 'bg-amber-400 dark:bg-amber-500';
  if (pct <= 75) return 'bg-blue-400 dark:bg-blue-500';
  return 'bg-green-400 dark:bg-green-500';
}

function getUtilBorder(pct: number): string {
  if (pct <= 25) return 'border-red-300 dark:border-red-700';
  if (pct <= 50) return 'border-amber-300 dark:border-amber-700';
  if (pct <= 75) return 'border-blue-300 dark:border-blue-700';
  return 'border-green-300 dark:border-green-700';
}

function getUtilText(pct: number): string {
  if (pct <= 25) return 'text-red-700 dark:text-red-400';
  if (pct <= 50) return 'text-amber-700 dark:text-amber-400';
  if (pct <= 75) return 'text-blue-700 dark:text-blue-400';
  return 'text-green-700 dark:text-green-400';
}

const ageGroupColors: Record<string, string> = {
  nursery: 'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700',
  toddler: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700',
  preschool: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700',
  kindy: 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700',
};

const ageGroupDot: Record<string, string> = {
  nursery: 'bg-pink-400',
  toddler: 'bg-blue-400',
  preschool: 'bg-green-400',
  kindy: 'bg-purple-400',
};

const ageGroupLabels: Record<string, string> = {
  nursery: 'Nursery',
  toddler: 'Toddler',
  preschool: 'Pre-School',
  kindy: 'Kindy',
};

export function RoomCombiningPlanner({
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
  onSavePlans,
}: RoomCombiningPlannerProps) {
  const centreRooms = useMemo(() => rooms.filter(r => r.centreId === centreId), [rooms, centreId]);
  const timeBlocks = DEFAULT_TIME_BLOCKS;

  // Local merge groups (draft state)
  const [mergeGroups, setMergeGroups] = useState<MergeGroup[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ blockId: string; groupId?: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from existing plans
  useMemo(() => {
    if (combiningPlans.length > 0 && mergeGroups.length === 0) {
      const groups: MergeGroup[] = combiningPlans.map(p => ({
        id: p.id,
        timeBlockId: p.timeBlock.id,
        roomIds: p.sourceRoomIds,
        targetRoomId: p.targetRoomId,
      }));
      setMergeGroups(groups);
    }
  }, [combiningPlans]);

  // Build stats matrix
  const statsMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { attendance: number; capacity: number; pct: number; staff: number; ratio: number }>> = {};
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
          staff: staffNeeded(attendance, room.requiredRatio),
          ratio: room.requiredRatio,
        };
      }
    }
    return matrix;
  }, [centreRooms, demandData, date, centreId, timeBlocks]);

  // Compute merged stats for a group
  const getMergedStats = useCallback((group: MergeGroup) => {
    const blockId = group.timeBlockId;
    let totalAttendance = 0;
    let totalCapacity = 0;
    let tightestRatio = Infinity;
    let staffBefore = 0;

    for (const rid of group.roomIds) {
      const s = statsMatrix[rid]?.[blockId];
      if (s) {
        totalAttendance += s.attendance;
        totalCapacity += s.capacity;
        tightestRatio = Math.min(tightestRatio, s.ratio);
        staffBefore += s.staff;
      }
    }

    const staffAfter = staffNeeded(totalAttendance, tightestRatio === Infinity ? 4 : tightestRatio);
    const pct = totalCapacity > 0 ? Math.round((totalAttendance / totalCapacity) * 100) : 0;

    return { totalAttendance, totalCapacity, pct, staffBefore, staffAfter, staffSaved: staffBefore - staffAfter, tightestRatio };
  }, [statsMatrix]);

  // Get rooms that are in a merge group for a specific block
  const getMergedRoomIds = useCallback((blockId: string): Set<string> => {
    const ids = new Set<string>();
    for (const g of mergeGroups) {
      if (g.timeBlockId === blockId) {
        g.roomIds.forEach(id => ids.add(id));
      }
    }
    return ids;
  }, [mergeGroups]);

  // Get groups for a block
  const getBlockGroups = useCallback((blockId: string): MergeGroup[] => {
    return mergeGroups.filter(g => g.timeBlockId === blockId);
  }, [mergeGroups]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, roomId: string, blockId: string | null, groupId: string | null) => {
    setDragState({ roomId, sourceBlockId: blockId, sourceGroupId: groupId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', roomId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string, groupId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ blockId, groupId });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, blockId: string, existingGroupId?: string) => {
    e.preventDefault();
    if (!dragState) return;

    const { roomId, sourceGroupId } = dragState;

    // Remove from source group if applicable
    if (sourceGroupId) {
      setMergeGroups(prev => {
        const updated = prev.map(g => {
          if (g.id === sourceGroupId) {
            const newRoomIds = g.roomIds.filter(id => id !== roomId);
            if (newRoomIds.length < 2) return null; // dissolve group
            return { ...g, roomIds: newRoomIds };
          }
          return g;
        }).filter(Boolean) as MergeGroup[];
        return updated;
      });
    }

    // Add to existing group or create new
    if (existingGroupId) {
      setMergeGroups(prev => prev.map(g => {
        if (g.id === existingGroupId && !g.roomIds.includes(roomId)) {
          return { ...g, roomIds: [...g.roomIds, roomId] };
        }
        return g;
      }));
    } else {
      // Check if room is already alone in a drop zone — need at least 2 for a group
      // For now, just mark intent — we'll show a drop zone that accepts a second room
    }

    setDragState(null);
    setDropTarget(null);
    setHasChanges(true);
  }, [dragState]);

  // Quick merge: select two rooms for a block
  const handleQuickMerge = useCallback((blockId: string, roomId1: string, roomId2: string) => {
    const existing = mergeGroups.find(g => g.timeBlockId === blockId && g.roomIds.includes(roomId1));
    if (existing) {
      if (!existing.roomIds.includes(roomId2)) {
        setMergeGroups(prev => prev.map(g =>
          g.id === existing.id ? { ...g, roomIds: [...g.roomIds, roomId2] } : g
        ));
      }
    } else {
      const targetRoom = centreRooms.find(r => r.id === roomId1);
      const otherRoom = centreRooms.find(r => r.id === roomId2);
      const target = (targetRoom?.capacity ?? 0) >= (otherRoom?.capacity ?? 0) ? roomId1 : roomId2;
      setMergeGroups(prev => [...prev, {
        id: `merge-${Date.now()}-${blockId}`,
        timeBlockId: blockId,
        roomIds: [roomId1, roomId2],
        targetRoomId: target,
      }]);
    }
    setHasChanges(true);
  }, [mergeGroups, centreRooms]);

  // Remove room from group
  const handleRemoveFromGroup = useCallback((groupId: string, roomId: string) => {
    setMergeGroups(prev => {
      return prev.map(g => {
        if (g.id !== groupId) return g;
        const newRoomIds = g.roomIds.filter(id => id !== roomId);
        if (newRoomIds.length < 2) return null;
        return { ...g, roomIds: newRoomIds };
      }).filter(Boolean) as MergeGroup[];
    });
    setHasChanges(true);
  }, []);

  // Dissolve a group
  const handleDissolveGroup = useCallback((groupId: string) => {
    setMergeGroups(prev => prev.filter(g => g.id !== groupId));
    setHasChanges(true);
  }, []);

  // Auto-suggest: apply all alert suggestions
  const handleAutoSuggest = useCallback(() => {
    const pending = alerts.filter(a => a.status === 'pending');
    const newGroups: MergeGroup[] = pending.map(a => ({
      id: `auto-${Date.now()}-${a.timeBlock.id}`,
      timeBlockId: a.timeBlock.id,
      roomIds: a.sourceRooms.map(r => r.roomId),
      targetRoomId: a.targetRoom?.roomId || a.sourceRooms[0].roomId,
    }));
    setMergeGroups(newGroups);
    setHasChanges(true);
    toast.success(`Applied ${newGroups.length} suggested combinations`);
  }, [alerts]);

  // Reset
  const handleReset = useCallback(() => {
    setMergeGroups([]);
    setHasChanges(false);
  }, []);

  // Save
  const handleSave = useCallback(() => {
    onSavePlans(mergeGroups);
    setHasChanges(false);
    toast.success(`Saved ${mergeGroups.length} combining plan${mergeGroups.length !== 1 ? 's' : ''}`);
  }, [mergeGroups, onSavePlans]);

  // Total savings
  const totalSavings = useMemo(() => {
    return mergeGroups.reduce((total, g) => {
      const stats = getMergedStats(g);
      return total + Math.max(0, stats.staffSaved);
    }, 0);
  }, [mergeGroups, getMergedStats]);

  // Pending alert count
  const pendingAlertCount = useMemo(() => alerts.filter(a => a.status === 'pending').length, [alerts]);

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Room Combining Planner"
      size="xl"
    >
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-1 pb-4 border-b">
          <div className="flex items-center gap-2">
            {pendingAlertCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleAutoSuggest} className="h-8 text-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Auto-Suggest ({pendingAlertCount})
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={mergeGroups.length === 0} className="h-8 text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {totalSavings > 0 && (
              <Badge variant="outline" className="text-xs text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                <TrendingDown className="h-3 w-3 mr-1" />
                Save {totalSavings} staff
              </Badge>
            )}
            <Button size="sm" onClick={handleSave} disabled={!hasChanges} className="h-8 text-xs">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Apply Plans
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 py-3 px-1">
          <div className="bg-card border rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-foreground">{centreRooms.length}</div>
            <div className="text-[10px] text-muted-foreground">Rooms</div>
          </div>
          <div className="bg-card border rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{pendingAlertCount}</div>
            <div className="text-[10px] text-muted-foreground">Suggestions</div>
          </div>
          <div className="bg-card border rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-primary">{mergeGroups.length}</div>
            <div className="text-[10px] text-muted-foreground">Merge Plans</div>
          </div>
          <div className="bg-card border rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{totalSavings}</div>
            <div className="text-[10px] text-muted-foreground">Staff Saved</div>
          </div>
        </div>

        {/* Interactive Grid */}
        <div className="flex-1 overflow-auto px-1 pb-4">
          <div className="border rounded-lg overflow-hidden">
            {/* Header row */}
            <div className="grid bg-muted/50 sticky top-0 z-10" style={{ gridTemplateColumns: '130px repeat(4, 1fr)' }}>
              <div className="px-3 py-2 border-r border-b text-xs font-medium text-muted-foreground flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                Drag rooms →
              </div>
              {timeBlocks.map(block => {
                const groups = getBlockGroups(block.id);
                return (
                  <div key={block.id} className="px-2 py-2 border-r border-b text-center last:border-r-0">
                    <div className="text-xs font-medium text-foreground">{block.label}</div>
                    <div className="text-[10px] text-muted-foreground">{block.startTime}–{block.endTime}</div>
                    {groups.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 mt-1 text-green-600 border-green-300">
                        <Combine className="h-2.5 w-2.5 mr-0.5" />
                        {groups.length} merged
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Room rows */}
            {centreRooms.map(room => (
              <div
                key={room.id}
                className="grid border-b last:border-b-0"
                style={{ gridTemplateColumns: '130px repeat(4, 1fr)' }}
              >
                {/* Room drag handle */}
                <div
                  className="px-2 py-2 border-r flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none"
                  draggable
                  onDragStart={(e) => handleDragStart(e, room.id, null, null)}
                >
                  <div className={cn('w-2 h-6 rounded-full shrink-0', ageGroupDot[room.ageGroup] || 'bg-muted')} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-foreground truncate">{room.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {ageGroupLabels[room.ageGroup]} · 1:{room.requiredRatio}
                    </div>
                  </div>
                </div>

                {/* Time block cells */}
                {timeBlocks.map(block => {
                  const stats = statsMatrix[room.id]?.[block.id];
                  if (!stats) return <div key={block.id} className="border-r last:border-r-0" />;

                  const mergedIds = getMergedRoomIds(block.id);
                  const isMerged = mergedIds.has(room.id);
                  const group = mergeGroups.find(g => g.timeBlockId === block.id && g.roomIds.includes(room.id));
                  const isTarget = group?.targetRoomId === room.id;
                  const isDropping = dropTarget?.blockId === block.id && dragState && !isMerged;
                  const hasAlert = alerts.some(a => a.timeBlock.id === block.id && a.status === 'pending' && a.sourceRooms.some(r => r.roomId === room.id));

                  return (
                    <div
                      key={block.id}
                      className={cn(
                        'border-r last:border-r-0 p-1.5 relative transition-all duration-150 min-h-[60px]',
                        isMerged && isTarget && 'bg-green-50/60 dark:bg-green-950/25 ring-1 ring-inset ring-green-300 dark:ring-green-700',
                        isMerged && !isTarget && 'bg-amber-50/40 dark:bg-amber-950/15',
                        !isMerged && hasAlert && 'bg-red-50/20 dark:bg-red-950/10',
                        isDropping && 'bg-primary/5 ring-2 ring-inset ring-primary/30 ring-dashed',
                      )}
                      onDragOver={(e) => handleDragOver(e, block.id, group?.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        if (!dragState) return;
                        const droppedRoomId = dragState.roomId;
                        if (droppedRoomId === room.id) return;

                        // If this cell already in a group, add to that group
                        if (group) {
                          handleDrop(e, block.id, group.id);
                          if (!group.roomIds.includes(droppedRoomId)) {
                            setMergeGroups(prev => prev.map(g =>
                              g.id === group.id ? { ...g, roomIds: [...g.roomIds, droppedRoomId] } : g
                            ));
                            setHasChanges(true);
                          }
                        } else {
                          // Create new merge group
                          handleQuickMerge(block.id, room.id, droppedRoomId);
                        }
                        setDragState(null);
                        setDropTarget(null);
                      }}
                    >
                      {/* Stats */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn('text-[10px] font-semibold', getUtilText(stats.pct))}>{stats.pct}%</span>
                        <span className="text-[10px] text-muted-foreground">{stats.attendance}/{stats.capacity}</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden mb-1">
                        <div className={cn('h-full rounded-full', getUtilColor(stats.pct))} style={{ width: `${Math.min(100, stats.pct)}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" />{stats.staff} staff
                      </div>

                      {/* Merge badge */}
                      {isMerged && isTarget && group && (
                        <MergedBadge
                          group={group}
                          stats={getMergedStats(group)}
                          rooms={centreRooms}
                          onRemoveRoom={(rid) => handleRemoveFromGroup(group.id, rid)}
                          onDissolve={() => handleDissolveGroup(group.id)}
                        />
                      )}
                      {isMerged && !isTarget && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 mt-1 text-amber-600 border-amber-400">
                          <ArrowRight className="h-2.5 w-2.5 mr-0.5" /> Merged
                        </Badge>
                      )}

                      {/* Drop hint */}
                      {isDropping && !isMerged && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded">
                          <div className="text-[10px] font-medium text-primary flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Drop to merge
                          </div>
                        </div>
                      )}

                      {/* Quick merge button for low-util rooms */}
                      {!isMerged && hasAlert && (
                        <QuickMergeButton
                          room={room}
                          block={block}
                          centreRooms={centreRooms}
                          mergedIds={mergedIds}
                          statsMatrix={statsMatrix}
                          onMerge={(otherRoomId) => handleQuickMerge(block.id, room.id, otherRoomId)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Active merge plans summary */}
          {mergeGroups.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Combine className="h-3.5 w-3.5 text-primary" />
                Merge Plans ({mergeGroups.length})
              </h3>
              {mergeGroups.map(group => {
                const stats = getMergedStats(group);
                const block = timeBlocks.find(b => b.id === group.timeBlockId);
                const targetName = centreRooms.find(r => r.id === group.targetRoomId)?.name || '—';
                const sourceNames = group.roomIds.filter(id => id !== group.targetRoomId).map(id => centreRooms.find(r => r.id === id)?.name || id);

                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center justify-between p-2.5 bg-card border rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <Badge variant="secondary" className="text-[10px] h-5">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {block?.label}
                      </Badge>
                      <span className="text-muted-foreground">{sourceNames.join(', ')}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">{targetName}</span>

                      {/* Real-time ratio display */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className={cn(
                              'text-[10px] h-5',
                              stats.staffSaved > 0 ? 'text-green-600 border-green-300' : 'text-muted-foreground'
                            )}>
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                              1:{stats.tightestRatio} · {stats.totalAttendance} kids
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <div>Combined: {stats.totalAttendance}/{stats.totalCapacity} ({stats.pct}%)</div>
                            <div>Staff: {stats.staffBefore} → {stats.staffAfter}</div>
                            <div className="text-green-600">Saving {stats.staffSaved} staff</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {stats.staffSaved > 0 && (
                        <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                          -{stats.staffSaved} staff
                        </span>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDissolveGroup(group.id)}>
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t pt-3 mt-4">
            <span className="font-medium">Utilisation:</span>
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-red-400" /> 0-25%</div>
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-amber-400" /> 26-50%</div>
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-blue-400" /> 51-75%</div>
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-green-400" /> 76-100%</div>
            <span className="ml-2">|</span>
            <span className="flex items-center gap-1"><GripVertical className="h-3 w-3" /> Drag rooms to merge</span>
          </div>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}

// Sub-component: Merged group badge shown in target cell
function MergedBadge({
  group,
  stats,
  rooms,
  onRemoveRoom,
  onDissolve,
}: {
  group: MergeGroup;
  stats: ReturnType<ReturnType<() => (g: MergeGroup) => any>>;
  rooms: Room[];
  onRemoveRoom: (roomId: string) => void;
  onDissolve: () => void;
}) {
  const otherRooms = group.roomIds.filter(id => id !== group.targetRoomId);

  return (
    <div className="mt-1.5 p-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-green-700 dark:text-green-400 flex items-center gap-0.5">
          <Combine className="h-2.5 w-2.5" />
          Merged ({group.roomIds.length} rooms)
        </span>
        <button onClick={onDissolve} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>
      {/* Merged rooms list */}
      <div className="flex flex-wrap gap-0.5 mb-1">
        {otherRooms.map(rid => {
          const r = rooms.find(rm => rm.id === rid);
          return (
            <span key={rid} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-background border text-[9px]">
              {r?.name || rid}
              <button onClick={() => onRemoveRoom(rid)} className="text-muted-foreground hover:text-destructive ml-0.5">
                <Minus className="h-2 w-2" />
              </button>
            </span>
          );
        })}
      </div>
      {/* Real-time ratio */}
      <div className="text-[9px] text-green-700 dark:text-green-400 flex items-center gap-2">
        <span>{stats.totalAttendance} kids · 1:{stats.tightestRatio}</span>
        <span className="font-semibold">Staff: {stats.staffBefore}→{stats.staffAfter}</span>
        {stats.staffSaved > 0 && <span className="text-green-600 font-bold">-{stats.staffSaved}</span>}
      </div>
    </div>
  );
}

// Sub-component: Quick merge dropdown for low-utilization cells
function QuickMergeButton({
  room,
  block,
  centreRooms,
  mergedIds,
  statsMatrix,
  onMerge,
}: {
  room: Room;
  block: TimeBlock;
  centreRooms: Room[];
  mergedIds: Set<string>;
  statsMatrix: Record<string, Record<string, { attendance: number; capacity: number; pct: number; staff: number; ratio: number }>>;
  onMerge: (otherRoomId: string) => void;
}) {
  const [showOptions, setShowOptions] = useState(false);

  // Compatible rooms (same age group, not already merged, also low)
  const compatible = centreRooms.filter(r =>
    r.id !== room.id &&
    !mergedIds.has(r.id) &&
    r.ageGroup === room.ageGroup &&
    (statsMatrix[r.id]?.[block.id]?.pct ?? 100) < 60
  );

  if (compatible.length === 0) return null;

  return (
    <div className="mt-1 relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="w-full text-[10px] px-1 py-0.5 rounded border border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center justify-center gap-0.5"
      >
        <Combine className="h-2.5 w-2.5" />
        Merge with…
      </button>
      {showOptions && (
        <div className="absolute top-full left-0 right-0 z-20 mt-0.5 bg-popover border rounded shadow-lg p-1 space-y-0.5">
          {compatible.map(r => {
            const rStats = statsMatrix[r.id]?.[block.id];
            return (
              <button
                key={r.id}
                onClick={() => { onMerge(r.id); setShowOptions(false); }}
                className="w-full text-left px-1.5 py-1 rounded hover:bg-accent text-[10px] flex items-center justify-between"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{rStats?.attendance ?? 0}/{rStats?.capacity ?? 0}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
