import { useMemo } from 'react';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import { Room, Shift } from '@/types/roster';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Users,
  Baby,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface NqfComplianceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  shifts: Shift[];
  demandData: DemandAnalyticsData[];
  dates: Date[];
}

interface RoomComplianceStatus {
  roomId: string;
  roomName: string;
  ageGroup: string;
  ratio: number;
  capacity: number;
  peakChildren: number;
  avgChildren: number;
  requiredStaff: number;
  scheduledStaff: number;
  staffGap: number;
  compliancePercent: number;
  status: 'compliant' | 'at-risk' | 'breach';
  breachSlots: { time: string; required: number; scheduled: number; gap: number }[];
}

const ageGroupLabels: Record<string, string> = {
  nursery: 'Nursery (0-2)',
  toddler: 'Toddler (2-3)',
  preschool: 'Preschool (3-5)',
  kindy: 'Kindy (4-5)',
};

const ratioLabels: Record<number, string> = {
  4: '1:4',
  5: '1:5',
  10: '1:10',
  11: '1:11',
};

export function NqfComplianceDashboard({
  isOpen,
  onClose,
  rooms,
  shifts,
  demandData,
  dates,
}: NqfComplianceDashboardProps) {
  const roomCompliance = useMemo(() => {
    return rooms.map((room): RoomComplianceStatus => {
      const roomDemand = demandData.filter(d => d.roomId === room.id);
      const roomShifts = shifts.filter(s => s.roomId === room.id);

      const peakChildren = roomDemand.length > 0
        ? Math.max(...roomDemand.map(d => d.bookedChildren))
        : 0;
      const avgChildren = roomDemand.length > 0
        ? Math.round(roomDemand.reduce((s, d) => s + d.bookedChildren, 0) / roomDemand.length)
        : 0;

      const requiredStaff = Math.ceil(peakChildren / room.requiredRatio);
      
      // Count unique staff scheduled for this room across all dates
      const uniqueStaffPerDay = new Map<string, Set<string>>();
      roomShifts.forEach(s => {
        if (s.staffId) {
          const existing = uniqueStaffPerDay.get(s.date) || new Set();
          existing.add(s.staffId);
          uniqueStaffPerDay.set(s.date, existing);
        }
      });
      
      const scheduledStaffCounts = Array.from(uniqueStaffPerDay.values()).map(s => s.size);
      const scheduledStaff = scheduledStaffCounts.length > 0
        ? Math.min(...scheduledStaffCounts)
        : 0;

      const staffGap = requiredStaff - scheduledStaff;
      const compliancePercent = requiredStaff > 0
        ? Math.round((scheduledStaff / requiredStaff) * 100)
        : 100;

      // Find breach slots
      const breachSlots: RoomComplianceStatus['breachSlots'] = [];
      roomDemand.forEach(d => {
        if (!d.staffRatioCompliant) {
          breachSlots.push({
            time: `${d.date} ${d.timeSlot}`,
            required: d.requiredStaff,
            scheduled: d.scheduledStaff,
            gap: d.requiredStaff - d.scheduledStaff,
          });
        }
      });

      const status: RoomComplianceStatus['status'] =
        staffGap <= 0 ? 'compliant' :
        staffGap === 1 ? 'at-risk' : 'breach';

      return {
        roomId: room.id,
        roomName: room.name,
        ageGroup: room.ageGroup,
        ratio: room.requiredRatio,
        capacity: room.capacity,
        peakChildren,
        avgChildren,
        requiredStaff,
        scheduledStaff,
        staffGap,
        compliancePercent,
        status,
        breachSlots,
      };
    });
  }, [rooms, shifts, demandData]);

  const overallStats = useMemo(() => {
    const total = roomCompliance.length;
    const compliant = roomCompliance.filter(r => r.status === 'compliant').length;
    const atRisk = roomCompliance.filter(r => r.status === 'at-risk').length;
    const breached = roomCompliance.filter(r => r.status === 'breach').length;
    const totalBreachSlots = roomCompliance.reduce((s, r) => s + r.breachSlots.length, 0);
    const overallPercent = total > 0
      ? Math.round(roomCompliance.reduce((s, r) => s + r.compliancePercent, 0) / total)
      : 100;
    return { total, compliant, atRisk, breached, totalBreachSlots, overallPercent };
  }, [roomCompliance]);

  const chartData = useMemo(() => {
    return roomCompliance.map(r => ({
      name: r.roomName,
      required: r.requiredStaff,
      scheduled: r.scheduledStaff,
      gap: Math.max(0, r.staffGap),
      compliance: r.compliancePercent,
    }));
  }, [roomCompliance]);

  const statusColor = (status: RoomComplianceStatus['status']) => {
    switch (status) {
      case 'compliant': return 'text-emerald-600';
      case 'at-risk': return 'text-amber-600';
      case 'breach': return 'text-red-600';
    }
  };

  const statusBg = (status: RoomComplianceStatus['status']) => {
    switch (status) {
      case 'compliant': return 'bg-emerald-50 border-emerald-200';
      case 'at-risk': return 'bg-amber-50 border-amber-200';
      case 'breach': return 'bg-red-50 border-red-200';
    }
  };

  const statusIcon = (status: RoomComplianceStatus['status']) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 size={16} className="text-emerald-600" />;
      case 'at-risk': return <AlertTriangle size={16} className="text-amber-600" />;
      case 'breach': return <XCircle size={16} className="text-red-600" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[520px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            NQF Ratio Compliance
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          {/* Overall Status */}
          <div className={cn(
            'rounded-lg border-2 p-4',
            overallStats.breached > 0 ? 'bg-red-50 border-red-300' :
            overallStats.atRisk > 0 ? 'bg-amber-50 border-amber-300' :
            'bg-emerald-50 border-emerald-300'
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {overallStats.breached > 0 ? (
                  <XCircle size={24} className="text-red-600" />
                ) : overallStats.atRisk > 0 ? (
                  <AlertTriangle size={24} className="text-amber-600" />
                ) : (
                  <CheckCircle2 size={24} className="text-emerald-600" />
                )}
                <span className="font-semibold text-lg">
                  {overallStats.breached > 0 ? 'Non-Compliant' :
                   overallStats.atRisk > 0 ? 'At Risk' : 'Fully Compliant'}
                </span>
              </div>
              <span className={cn(
                'text-2xl font-bold',
                overallStats.overallPercent >= 100 ? 'text-emerald-700' :
                overallStats.overallPercent >= 80 ? 'text-amber-700' : 'text-red-700'
              )}>
                {overallStats.overallPercent}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/70 rounded-md p-2">
                <div className="text-xl font-bold text-emerald-600">{overallStats.compliant}</div>
                <div className="text-xs text-muted-foreground">Compliant</div>
              </div>
              <div className="bg-white/70 rounded-md p-2">
                <div className="text-xl font-bold text-amber-600">{overallStats.atRisk}</div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </div>
              <div className="bg-white/70 rounded-md p-2">
                <div className="text-xl font-bold text-red-600">{overallStats.breached}</div>
                <div className="text-xs text-muted-foreground">Breached</div>
              </div>
            </div>
          </div>

          {/* Staffing Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Users size={14} />
              Required vs Scheduled Staff
            </h3>
            <div className="h-[160px] bg-muted/30 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number, name: string) => [value, name === 'required' ? 'Required' : name === 'scheduled' ? 'Scheduled' : 'Gap']}
                  />
                  <Bar dataKey="required" name="Required" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="scheduled" name="Scheduled" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.gap > 1 ? '#ef4444' : entry.gap > 0 ? '#f59e0b' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Room Cards */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Room Breakdown</h3>
            <div className="space-y-2">
              {roomCompliance.map(room => (
                <div
                  key={room.roomId}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    statusBg(room.status)
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(room.status)}
                      <span className="font-medium text-sm">{room.roomName}</span>
                      <span className="text-xs text-muted-foreground">
                        {ageGroupLabels[room.ageGroup] || room.ageGroup}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-white/80 px-1.5 py-0.5 rounded">
                        {ratioLabels[room.ratio] || `1:${room.ratio}`}
                      </span>
                      <span className={cn('text-sm font-bold', statusColor(room.status))}>
                        {room.compliancePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Baby size={12} className="text-muted-foreground" />
                      <span>Peak: {room.peakChildren}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-muted-foreground" />
                      <span>Need: {room.requiredStaff}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-muted-foreground" />
                      <span>Have: {room.scheduledStaff}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {room.staffGap > 0 ? (
                        <TrendingDown size={12} className="text-red-500" />
                      ) : (
                        <TrendingUp size={12} className="text-emerald-500" />
                      )}
                      <span className={room.staffGap > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                        {room.staffGap > 0 ? `-${room.staffGap}` : '+0'} gap
                      </span>
                    </div>
                  </div>

                  {/* Breach Alerts */}
                  {room.breachSlots.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <div className="flex items-center gap-1 text-xs font-semibold text-red-700 mb-1">
                        <AlertTriangle size={12} />
                        {room.breachSlots.length} breach slot{room.breachSlots.length > 1 ? 's' : ''} detected
                      </div>
                      <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
                        {room.breachSlots.slice(0, 5).map((slot, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] text-red-600 bg-red-100/50 rounded px-1.5 py-0.5">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {slot.time}
                            </span>
                            <span className="font-mono">
                              {slot.scheduled}/{slot.required} staff (−{slot.gap})
                            </span>
                          </div>
                        ))}
                        {room.breachSlots.length > 5 && (
                          <div className="text-[11px] text-red-500 text-center">
                            +{room.breachSlots.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Breach Summary */}
          {overallStats.totalBreachSlots > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                <AlertTriangle size={16} />
                Action Required
              </div>
              <p className="text-xs text-red-600">
                {overallStats.totalBreachSlots} time slot{overallStats.totalBreachSlots > 1 ? 's' : ''} across {overallStats.breached + overallStats.atRisk} room{(overallStats.breached + overallStats.atRisk) > 1 ? 's' : ''} have
                insufficient staffing to meet NQF ratio requirements. Use the Demand Shift Generator or Auto-Scheduler to fill coverage gaps.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
