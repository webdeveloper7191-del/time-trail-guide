import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { RoomDemandProfile, ShiftEnvelope } from '@/types/demandShiftGeneration';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, Baby, Clock, TrendingUp, UserCheck, ChevronDown } from 'lucide-react';
import { StaffMember } from '@/types/roster';
import { StaffCandidateScore } from '@/lib/autoScheduler';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface StaffAssignmentInfo {
  staffId: string;
  staffName: string;
  score: number;
}

interface DemandCurveChartProps {
  profiles: RoomDemandProfile[];
  envelopes: ShiftEnvelope[];
  selectedRoomId?: string;
  height?: number;
  assignments?: Map<string, StaffAssignmentInfo>;
  staff?: StaffMember[];
  onReassignShift?: (envelopeId: string, staffId: string, staffName: string) => void;
  staffScorer?: (envelope: ShiftEnvelope) => Map<string, StaffCandidateScore>;
}

export function DemandCurveChart({
  profiles,
  envelopes,
  selectedRoomId,
  height = 320,
  assignments,
  staff,
  onReassignShift,
  staffScorer,
}: DemandCurveChartProps) {
  const [reassignSearch, setReassignSearch] = useState('');
  const [activeEnvelopeScores, setActiveEnvelopeScores] = useState<Map<string, StaffCandidateScore> | null>(null);
  const profile = useMemo(() => {
    if (selectedRoomId) return profiles.find(p => p.roomId === selectedRoomId);
    return profiles[0];
  }, [profiles, selectedRoomId]);

  const roomEnvelopes = useMemo(
    () => envelopes.filter(e => e.roomId === (profile?.roomId ?? '')),
    [envelopes, profile]
  );

  const chartData = useMemo(() => {
    if (!profile) return [];
    return profile.intervals.map(iv => ({
      time: iv.time,
      booked: iv.bookedChildren,
      predicted: iv.predictedAttendance,
      required: iv.requiredStaff,
      scheduled: iv.scheduledStaff,
      surplus: iv.surplus,
    }));
  }, [profile]);

  const stats = useMemo(() => {
    if (!profile) return null;
    const peak = Math.max(...profile.intervals.map(i => i.bookedChildren));
    const peakStaff = Math.max(...profile.intervals.map(i => i.requiredStaff));
    const avgAttendance = profile.intervals.length > 0
      ? Math.round(profile.intervals.reduce((s, i) => s + i.predictedAttendance, 0) / profile.intervals.length)
      : 0;
    return { peak, peakStaff, avgAttendance, ratio: profile.requiredRatio };
  }, [profile]);

  if (!profile || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No demand data available for this room
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <Baby className="h-3.5 w-3.5 text-blue-600" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Peak Booked</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{stats.peak}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Avg Attendance</p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{stats.avgAttendance}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Peak Staff</p>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{stats.peakStaff}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
            <Clock className="h-3.5 w-3.5 text-purple-600" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Ratio</p>
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">1:{stats.ratio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              interval={3}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  booked: 'Booked Children',
                  predicted: 'Predicted Attendance',
                  required: 'Required Staff',
                  scheduled: 'Scheduled Staff',
                };
                return [value, labels[name] || name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  booked: 'Booked',
                  predicted: 'Predicted',
                  required: 'Required Staff',
                  scheduled: 'Scheduled Staff',
                };
                return labels[value] || value;
              }}
            />
            <Area
              type="monotone"
              dataKey="booked"
              stroke="hsl(210, 70%, 55%)"
              fill="hsl(210, 70%, 55%)"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="hsl(150, 60%, 45%)"
              fill="hsl(150, 60%, 45%)"
              fillOpacity={0.2}
              strokeWidth={1.5}
            />
            <Area
              type="stepAfter"
              dataKey="required"
              stroke="hsl(30, 80%, 55%)"
              fill="none"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            <Area
              type="stepAfter"
              dataKey="scheduled"
              stroke="hsl(280, 60%, 55%)"
              fill="none"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Shift envelope blocks */}
      {roomEnvelopes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Generated Shift Blocks</p>
          <div className="relative h-auto min-h-[32px] flex flex-wrap gap-1">
            {roomEnvelopes.map((env) => {
              const hours = Math.round((env.durationMinutes - env.breakMinutes) / 60 * 10) / 10;
              const assignment = assignments?.get(env.id);
              const canReassign = !!onReassignShift && !!staff && staff.length > 0;

              const blockContent = (
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-all",
                    canReassign && "cursor-pointer hover:ring-2 hover:ring-primary/40",
                    env.priority === 'critical' && "bg-red-100 border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300",
                    env.priority === 'high' && "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
                    env.priority === 'normal' && "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300",
                    env.priority === 'low' && "bg-muted border-border text-muted-foreground",
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {env.startTime}–{env.endTime}
                  <span className="opacity-70">({hours}h)</span>
                  {assignment && (
                    <span className="flex items-center gap-0.5 ml-1 text-primary">
                      <UserCheck className="h-2.5 w-2.5" />
                      {assignment.staffName.split(' ')[0]}
                    </span>
                  )}
                  {env.priority === 'critical' && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Critical</Badge>}
                  {canReassign && <ChevronDown className="h-2.5 w-2.5 opacity-50" />}
                </div>
              );

              if (!canReassign) return <div key={env.id}>{blockContent}</div>;

              const filteredStaff = staff!.filter(s =>
                s.name.toLowerCase().includes(reassignSearch.toLowerCase()) ||
                s.role.toLowerCase().includes(reassignSearch.toLowerCase())
              );

              return (
                <Popover key={env.id} onOpenChange={(open) => {
                  setReassignSearch('');
                  if (open && staffScorer) {
                    setActiveEnvelopeScores(staffScorer(env));
                  } else {
                    setActiveEnvelopeScores(null);
                  }
                }}>
                  <PopoverTrigger asChild>{blockContent}</PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1.5">
                      Assign staff to {env.startTime}–{env.endTime}
                    </p>
                    <Input
                      placeholder="Search staff..."
                      value={reassignSearch}
                      onChange={e => setReassignSearch(e.target.value)}
                      className="h-6 text-[10px] mb-1.5"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {/* Unassign option */}
                      {assignment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-6 text-[10px] text-destructive hover:text-destructive"
                          onClick={() => onReassignShift!(env.id, '', '')}
                        >
                          Remove assignment
                        </Button>
                      )}
                      {filteredStaff
                        .map(s => {
                          const score = activeEnvelopeScores?.get(s.id);
                          return { staff: s, score };
                        })
                        .sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0))
                        .map(({ staff: s, score }) => {
                          const scoreVal = score?.totalScore ?? 0;
                          const isIneligible = score && !score.isEligible;
                          return (
                            <Button
                              key={s.id}
                              variant={assignment?.staffId === s.id ? 'secondary' : 'ghost'}
                              size="sm"
                              className={cn(
                                "w-full justify-start h-auto py-1 px-2 text-[10px] gap-1",
                                isIneligible && "opacity-50"
                              )}
                              onClick={() => onReassignShift!(env.id, s.id, s.name)}
                            >
                              <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                <div className="flex items-center w-full gap-1">
                                  <span className="truncate">{s.name}</span>
                                  <span className="text-muted-foreground ml-auto shrink-0">${s.hourlyRate}/h</span>
                                </div>
                                {score && (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <Progress
                                      value={scoreVal}
                                      className={cn(
                                        "h-1.5 flex-1",
                                        scoreVal >= 70 ? "[&>div]:bg-emerald-500" :
                                        scoreVal >= 40 ? "[&>div]:bg-amber-500" :
                                        "[&>div]:bg-destructive"
                                      )}
                                    />
                                    <span className={cn(
                                      "text-[9px] font-semibold shrink-0 w-6 text-right",
                                      scoreVal >= 70 ? "text-emerald-600" :
                                      scoreVal >= 40 ? "text-amber-600" :
                                      "text-destructive"
                                    )}>
                                      {scoreVal}
                                    </span>
                                  </div>
                                )}
                                {score?.issues && score.issues.length > 0 && (
                                  <span className="text-[8px] text-destructive/80 truncate w-full">
                                    {score.issues[0]}
                                  </span>
                                )}
                              </div>
                            </Button>
                          );
                        })}
                      {filteredStaff.length === 0 && (
                        <p className="text-[10px] text-muted-foreground text-center py-2">No matching staff</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
