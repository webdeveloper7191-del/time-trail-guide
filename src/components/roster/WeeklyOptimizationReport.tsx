import { useMemo } from 'react';
import { StaffMember, Shift, Centre, Room, roleLabels, ageGroupLabels } from '@/types/roster';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserMinus,
  UserPlus,
  Calendar,
  Target,
  Lightbulb,
  BarChart3,
  ArrowRight,
  Baby,
  XCircle,
  Zap,
  PiggyBank,
  Shield,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Cell,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WeeklyOptimizationReportProps {
  shifts: Shift[];
  staff: StaffMember[];
  centre: Centre;
  dates: Date[];
  weeklyBudget: number;
  analyticsData: DemandAnalyticsData[];
  absences: StaffAbsence[];
  isOpen: boolean;
  onClose: () => void;
}

interface RoomDayMetrics {
  roomId: string;
  roomName: string;
  ageGroup: string;
  date: string;
  dayName: string;
  scheduledStaff: number;
  requiredStaff: number;
  staffDiff: number;
  hoursScheduled: number;
  hoursRequired: number;
  hoursDiff: number;
  bookedChildren: number;
  actualAttendance: number;
  attendanceRate: number;
  ratioCompliant: boolean;
  breachSlots: number;
  totalSlots: number;
  potentialSavings: number;
  staffingGapCost: number;
}

interface OptimizationRecommendation {
  id: string;
  type: 'savings' | 'compliance' | 'coverage' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  roomId?: string;
  date?: string;
}

export function WeeklyOptimizationReport({ 
  shifts, 
  staff, 
  centre, 
  dates, 
  weeklyBudget, 
  analyticsData,
  absences,
  isOpen, 
  onClose 
}: WeeklyOptimizationReportProps) {
  const centreShifts = shifts.filter(s => s.centreId === centre.id);
  const avgHourlyRate = staff.length > 0 
    ? staff.reduce((sum, s) => sum + s.hourlyRate, 0) / staff.length 
    : 30;

  // Calculate room-by-day metrics
  const roomDayMetrics = useMemo(() => {
    const metrics: RoomDayMetrics[] = [];
    
    centre.rooms.forEach(room => {
      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Get analytics for this room/day
        const dayAnalytics = analyticsData.filter(
          d => d.roomId === room.id && d.date === dateStr
        );
        
        // Get shifts for this room/day
        const dayShifts = centreShifts.filter(
          s => s.roomId === room.id && s.date === dateStr
        );
        
        // Calculate hours from shifts
        const hoursScheduled = dayShifts.reduce((total, shift) => {
          const [startH, startM] = shift.startTime.split(':').map(Number);
          const [endH, endM] = shift.endTime.split(':').map(Number);
          return total + ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
        }, 0);
        
        // Aggregate analytics data
        const avgScheduledStaff = dayAnalytics.length > 0
          ? Math.round(dayAnalytics.reduce((sum, d) => sum + d.scheduledStaff, 0) / dayAnalytics.length)
          : dayShifts.length;
        const avgRequiredStaff = dayAnalytics.length > 0
          ? Math.round(dayAnalytics.reduce((sum, d) => sum + d.requiredStaff, 0) / dayAnalytics.length)
          : 2;
        const totalBooked = dayAnalytics.length > 0
          ? Math.round(dayAnalytics.reduce((sum, d) => sum + d.bookedChildren, 0) / dayAnalytics.length)
          : 0;
        const totalAttendance = dayAnalytics.length > 0
          ? Math.round(dayAnalytics.reduce((sum, d) => sum + d.historicalAttendance, 0) / dayAnalytics.length)
          : 0;
        const avgAttendanceRate = dayAnalytics.length > 0
          ? Math.round(dayAnalytics.reduce((sum, d) => sum + d.attendanceRate, 0) / dayAnalytics.length)
          : 0;
        
        const compliantSlots = dayAnalytics.filter(d => d.staffRatioCompliant).length;
        const breachSlots = dayAnalytics.length - compliantSlots;
        
        const staffDiff = avgScheduledStaff - avgRequiredStaff;
        const hoursRequired = avgRequiredStaff * 8; // Assuming 8-hour shifts
        const hoursDiff = hoursScheduled - hoursRequired;
        
        const potentialSavings = staffDiff > 0 ? staffDiff * 8 * avgHourlyRate : 0;
        const staffingGapCost = staffDiff < 0 ? Math.abs(staffDiff) * 8 * avgHourlyRate * 1.5 : 0; // 1.5x for urgency
        
        metrics.push({
          roomId: room.id,
          roomName: room.name,
          ageGroup: ageGroupLabels[room.ageGroup],
          date: dateStr,
          dayName,
          scheduledStaff: avgScheduledStaff,
          requiredStaff: avgRequiredStaff,
          staffDiff,
          hoursScheduled: Math.round(hoursScheduled * 10) / 10,
          hoursRequired,
          hoursDiff: Math.round(hoursDiff * 10) / 10,
          bookedChildren: totalBooked,
          actualAttendance: totalAttendance,
          attendanceRate: avgAttendanceRate,
          ratioCompliant: breachSlots === 0,
          breachSlots,
          totalSlots: dayAnalytics.length || 8,
          potentialSavings: Math.round(potentialSavings),
          staffingGapCost: Math.round(staffingGapCost),
        });
      });
    });
    
    return metrics;
  }, [centre.rooms, dates, analyticsData, centreShifts, avgHourlyRate]);

  // Aggregate weekly totals
  const weeklyTotals = useMemo(() => {
    const totals = {
      totalHoursScheduled: 0,
      totalHoursRequired: 0,
      totalPotentialSavings: 0,
      totalStaffingGapCost: 0,
      totalBreachSlots: 0,
      totalSlots: 0,
      daysOverstaffed: 0,
      daysUnderstaffed: 0,
      daysOptimal: 0,
      avgAttendanceRate: 0,
      totalBookedChildren: 0,
      totalActualAttendance: 0,
    };
    
    roomDayMetrics.forEach(m => {
      totals.totalHoursScheduled += m.hoursScheduled;
      totals.totalHoursRequired += m.hoursRequired;
      totals.totalPotentialSavings += m.potentialSavings;
      totals.totalStaffingGapCost += m.staffingGapCost;
      totals.totalBreachSlots += m.breachSlots;
      totals.totalSlots += m.totalSlots;
      totals.totalBookedChildren += m.bookedChildren;
      totals.totalActualAttendance += m.actualAttendance;
      
      if (m.staffDiff > 0) totals.daysOverstaffed++;
      else if (m.staffDiff < 0) totals.daysUnderstaffed++;
      else totals.daysOptimal++;
    });
    
    totals.avgAttendanceRate = totals.totalBookedChildren > 0
      ? Math.round((totals.totalActualAttendance / totals.totalBookedChildren) * 100)
      : 0;
    
    return totals;
  }, [roomDayMetrics]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    const recs: OptimizationRecommendation[] = [];
    
    // Group by room for room-level recommendations
    const roomMetrics = centre.rooms.map(room => {
      const roomData = roomDayMetrics.filter(m => m.roomId === room.id);
      const totalSavings = roomData.reduce((sum, m) => sum + m.potentialSavings, 0);
      const totalGapCost = roomData.reduce((sum, m) => sum + m.staffingGapCost, 0);
      const breachDays = roomData.filter(m => m.breachSlots > 0).length;
      const overstaffedDays = roomData.filter(m => m.staffDiff > 0);
      const understaffedDays = roomData.filter(m => m.staffDiff < 0);
      const avgAttendance = Math.round(roomData.reduce((sum, m) => sum + m.attendanceRate, 0) / roomData.length);
      
      return {
        room,
        totalSavings,
        totalGapCost,
        breachDays,
        overstaffedDays,
        understaffedDays,
        avgAttendance,
      };
    });
    
    // Savings recommendations
    roomMetrics.filter(r => r.totalSavings > 100).forEach(r => {
      const days = r.overstaffedDays.map(d => d.dayName).join(', ');
      recs.push({
        id: `savings-${r.room.id}`,
        type: 'savings',
        priority: r.totalSavings > 500 ? 'high' : 'medium',
        title: `Reduce staff in ${r.room.name}`,
        description: `${r.room.name} is overstaffed on ${days}. Consider reducing 1 staff member on these days.`,
        impact: `Save $${r.totalSavings} this week`,
        action: 'Review and adjust shifts',
        roomId: r.room.id,
      });
    });
    
    // Coverage recommendations
    roomMetrics.filter(r => r.understaffedDays.length > 0).forEach(r => {
      const days = r.understaffedDays.map(d => d.dayName).join(', ');
      recs.push({
        id: `coverage-${r.room.id}`,
        type: 'coverage',
        priority: r.totalGapCost > 300 ? 'high' : 'medium',
        title: `Staff shortage in ${r.room.name}`,
        description: `${r.room.name} is understaffed on ${days}. Add coverage to meet ratio requirements.`,
        impact: `Avoid $${r.totalGapCost} in agency/overtime costs`,
        action: 'Add shifts or request agency staff',
        roomId: r.room.id,
      });
    });
    
    // Compliance recommendations
    roomMetrics.filter(r => r.breachDays > 0).forEach(r => {
      recs.push({
        id: `compliance-${r.room.id}`,
        type: 'compliance',
        priority: 'high',
        title: `Ratio breaches in ${r.room.name}`,
        description: `${r.room.name} has ${r.breachDays} day(s) with ratio compliance issues. Address immediately.`,
        impact: 'Avoid regulatory penalties',
        action: 'Adjust staffing immediately',
        roomId: r.room.id,
      });
    });
    
    // Efficiency recommendations based on attendance patterns
    roomMetrics.filter(r => r.avgAttendance < 80).forEach(r => {
      recs.push({
        id: `efficiency-${r.room.id}`,
        type: 'efficiency',
        priority: 'low',
        title: `Low attendance pattern in ${r.room.name}`,
        description: `Average attendance is ${r.avgAttendance}% of bookings. Consider adjusting staff schedules to match actual attendance.`,
        impact: 'Improve staffing efficiency',
        action: 'Analyze peak attendance times',
        roomId: r.room.id,
      });
    });
    
    // Cross-room rebalancing opportunities
    const overstaffedRooms = roomMetrics.filter(r => r.overstaffedDays.length > 2);
    const understaffedRooms = roomMetrics.filter(r => r.understaffedDays.length > 2);
    
    if (overstaffedRooms.length > 0 && understaffedRooms.length > 0) {
      recs.push({
        id: 'rebalance',
        type: 'efficiency',
        priority: 'medium',
        title: 'Cross-room staff rebalancing opportunity',
        description: `Move staff from ${overstaffedRooms.map(r => r.room.name).join(', ')} to ${understaffedRooms.map(r => r.room.name).join(', ')} on matching days.`,
        impact: 'Optimize without additional staff',
        action: 'Review shift assignments',
      });
    }
    
    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [roomDayMetrics, centre.rooms]);

  // Daily summary data for chart
  const dailySummary = useMemo(() => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dates.slice(0, 7).map((date, idx) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayMetrics = roomDayMetrics.filter(m => m.date === dateStr);
      
      const scheduled = dayMetrics.reduce((sum, m) => sum + m.scheduledStaff, 0);
      const required = dayMetrics.reduce((sum, m) => sum + m.requiredStaff, 0);
      const savings = dayMetrics.reduce((sum, m) => sum + m.potentialSavings, 0);
      const gaps = dayMetrics.reduce((sum, m) => sum + m.staffingGapCost, 0);
      const breaches = dayMetrics.reduce((sum, m) => sum + m.breachSlots, 0);
      const attendance = Math.round(dayMetrics.reduce((sum, m) => sum + m.attendanceRate, 0) / (dayMetrics.length || 1));
      
      return {
        day: dayNames[idx] || date.toLocaleDateString('en-US', { weekday: 'short' }),
        scheduled,
        required,
        diff: scheduled - required,
        savings,
        gaps,
        breaches,
        attendance,
      };
    });
  }, [dates, roomDayMetrics]);

  // Room comparison data
  const roomComparison = useMemo(() => {
    return centre.rooms.map(room => {
      const roomData = roomDayMetrics.filter(m => m.roomId === room.id);
      const avgScheduled = Math.round(roomData.reduce((sum, m) => sum + m.scheduledStaff, 0) / roomData.length * 10) / 10;
      const avgRequired = Math.round(roomData.reduce((sum, m) => sum + m.requiredStaff, 0) / roomData.length * 10) / 10;
      const totalSavings = roomData.reduce((sum, m) => sum + m.potentialSavings, 0);
      const totalGaps = roomData.reduce((sum, m) => sum + m.staffingGapCost, 0);
      const compliantDays = roomData.filter(m => m.ratioCompliant).length;
      
      return {
        name: room.name.length > 10 ? room.name.substring(0, 10) + '...' : room.name,
        fullName: room.name,
        avgScheduled,
        avgRequired,
        efficiency: avgRequired > 0 ? Math.round((avgScheduled / avgRequired) * 100) : 100,
        savings: totalSavings,
        gaps: totalGaps,
        compliance: Math.round((compliantDays / roomData.length) * 100),
      };
    });
  }, [centre.rooms, roomDayMetrics]);

  // Staff leave summary
  const leaveSummary = useMemo(() => {
    const summary = {
      sick: 0,
      annual: 0,
      personal: 0,
      other: 0,
      total: 0,
    };
    
    absences.forEach(a => {
      summary[a.type]++;
      summary.total++;
    });
    
    return summary;
  }, [absences]);

  const budgetUsage = (weeklyTotals.totalHoursScheduled * avgHourlyRate / weeklyBudget) * 100;
  const complianceRate = weeklyTotals.totalSlots > 0 
    ? Math.round(((weeklyTotals.totalSlots - weeklyTotals.totalBreachSlots) / weeklyTotals.totalSlots) * 100)
    : 100;

  const priorityColors = {
    high: 'text-destructive',
    medium: 'text-warning',
    low: 'text-primary',
  };

  const typeIcons = {
    savings: PiggyBank,
    compliance: Shield,
    coverage: Users,
    efficiency: Zap,
  };

  const typeColors = {
    savings: 'bg-success/10 border-success/30 text-success',
    compliance: 'bg-destructive/10 border-destructive/30 text-destructive',
    coverage: 'bg-warning/10 border-warning/30 text-warning',
    efficiency: 'bg-primary/10 border-primary/30 text-primary',
  };

  return (
    <PrimaryOffCanvas
      open={isOpen}
      onClose={onClose}
      title="Weekly Optimization Report"
      description={`${centre.name} • ${dates[0]?.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${dates[dates.length - 1]?.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`}
      icon={BarChart3}
      size="4xl"
      showFooter={false}
    >
      <div className="space-y-4">
        {/* Key Metrics Overview */}
        <FormSection title="Key Metrics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                icon={<Clock className="h-5 w-5" />}
                label="Hours Scheduled"
                value={`${Math.round(weeklyTotals.totalHoursScheduled)}h`}
                subValue={`${Math.round(weeklyTotals.totalHoursRequired)}h required`}
                trend={weeklyTotals.totalHoursScheduled > weeklyTotals.totalHoursRequired ? 'up' : 'down'}
                color={Math.abs(weeklyTotals.totalHoursScheduled - weeklyTotals.totalHoursRequired) < weeklyTotals.totalHoursRequired * 0.1 ? 'success' : 'warning'}
              />
              <MetricCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Potential Savings"
                value={`$${weeklyTotals.totalPotentialSavings.toLocaleString()}`}
                subValue={weeklyTotals.daysOverstaffed > 0 ? `${weeklyTotals.daysOverstaffed} overstaffed days` : 'Optimally staffed'}
                trend={weeklyTotals.totalPotentialSavings > 0 ? 'up' : 'neutral'}
                color={weeklyTotals.totalPotentialSavings > 500 ? 'info' : 'success'}
              />
              <MetricCard
                icon={<Shield className="h-5 w-5" />}
                label="Compliance Rate"
                value={`${complianceRate}%`}
                subValue={`${weeklyTotals.totalBreachSlots} breach slots`}
                trend={complianceRate >= 95 ? 'up' : 'down'}
                color={complianceRate >= 95 ? 'success' : complianceRate >= 80 ? 'warning' : 'error'}
              />
              <MetricCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Attendance Rate"
                value={`${weeklyTotals.avgAttendanceRate}%`}
                subValue="vs bookings"
                trend={weeklyTotals.avgAttendanceRate >= 85 ? 'up' : 'down'}
                color={weeklyTotals.avgAttendanceRate >= 85 ? 'success' : 'warning'}
              />
          </div>
        </FormSection>

        {/* Budget Progress */}
        <FormSection title="Budget Usage">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Weekly Budget Usage</span>
            <span className={cn(
              "text-sm font-semibold",
              budgetUsage > 100 ? "text-destructive" : budgetUsage > 90 ? "text-warning" : "text-success"
            )}>
              {budgetUsage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(budgetUsage, 100)} 
            className={cn(
              "h-3",
              budgetUsage > 100 ? "[&>div]:bg-destructive" : budgetUsage > 90 ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
            )}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Est. Cost: ${Math.round(weeklyTotals.totalHoursScheduled * avgHourlyRate).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              Budget: ${weeklyBudget.toLocaleString()}
            </span>
          </div>
        </FormSection>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <FormSection title="Optimization Recommendations">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-warning" />
              <Badge variant="secondary">{recommendations.length} actions</Badge>
            </div>
            <div className="space-y-2">
                    {recommendations.slice(0, 6).map(rec => {
                      const Icon = typeIcons[rec.type];
                      return (
                        <div 
                          key={rec.id}
                          className={cn(
                            "rounded-lg border p-3",
                            typeColors[rec.type]
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold">{rec.title}</span>
                                <Badge 
                                  variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'outline' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-xs opacity-90 mb-2">{rec.description}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold">{rec.impact}</span>
                                <div className="flex items-center gap-1 opacity-70">
                                  <ArrowRight className="h-3 w-3" />
                                  <span className="text-xs">{rec.action}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
            </div>
          </FormSection>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormSection title="Daily Staffing Overview">
            <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={dailySummary}>
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="scheduled" name="Scheduled" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="required" name="Required" fill="hsl(var(--muted-foreground))" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="attendance" name="Attendance %" yAxisId={0} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
            </div>
          </FormSection>

          <FormSection title="Room Efficiency Comparison">
            <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roomComparison} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 150]} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value, name) => [
                            name === 'efficiency' ? `${value}%` : value,
                            name === 'efficiency' ? 'Efficiency' : name === 'compliance' ? 'Compliance' : name
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <ReferenceLine x={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                        <Bar dataKey="efficiency" name="Staffing %" radius={[0, 4, 4, 0]}>
                          {roomComparison.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.efficiency > 110 ? 'hsl(var(--chart-3))' : 
                                entry.efficiency < 90 ? 'hsl(var(--destructive))' : 
                                'hsl(var(--chart-2))'
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
            </div>
          </FormSection>
        </div>

        {/* Room Detail Table */}
        <FormSection title="Room-by-Day Breakdown">
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2 font-medium">Room</th>
                        {dates.slice(0, 7).map((date, idx) => (
                          <th key={idx} className="text-center p-2 font-medium min-w-[70px]">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </th>
                        ))}
                        <th className="text-center p-2 font-medium">Week Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {centre.rooms.map(room => {
                        const roomData = roomDayMetrics.filter(m => m.roomId === room.id);
                        const weekSavings = roomData.reduce((sum, m) => sum + m.potentialSavings, 0);
                        const weekGaps = roomData.reduce((sum, m) => sum + m.staffingGapCost, 0);
                        
                        return (
                          <tr key={room.id} className="border-b border-border hover:bg-muted/20">
                            <td className="p-2">
                              <div className="font-medium">{room.name}</div>
                              <div className="text-[10px] text-muted-foreground">{ageGroupLabels[room.ageGroup]}</div>
                            </td>
                            {dates.slice(0, 7).map((date, idx) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const dayMetric = roomData.find(m => m.date === dateStr);
                              
                              if (!dayMetric) return <td key={idx} className="text-center p-2 text-muted-foreground">-</td>;
                              
                              return (
                                <td key={idx} className="text-center p-2">
                                  <div className={cn(
                                    "inline-flex flex-col items-center rounded px-2 py-1 min-w-[50px]",
                                    dayMetric.staffDiff > 0 && "bg-warning/10",
                                    dayMetric.staffDiff < 0 && "bg-destructive/10",
                                    dayMetric.staffDiff === 0 && "bg-success/10"
                                  )}>
                                    <span className={cn(
                                      "font-semibold text-sm",
                                      dayMetric.staffDiff > 0 && "text-warning",
                                      dayMetric.staffDiff < 0 && "text-destructive",
                                      dayMetric.staffDiff === 0 && "text-success"
                                    )}>
                                      {dayMetric.scheduledStaff}/{dayMetric.requiredStaff}
                                    </span>
                                    {dayMetric.staffDiff !== 0 && (
                                      <span className={cn(
                                        "text-[10px]",
                                        dayMetric.staffDiff > 0 && "text-warning",
                                        dayMetric.staffDiff < 0 && "text-destructive"
                                      )}>
                                        {dayMetric.staffDiff > 0 ? `+${dayMetric.staffDiff}` : dayMetric.staffDiff}
                                      </span>
                                    )}
                                    {!dayMetric.ratioCompliant && (
                                      <AlertTriangle className="h-3 w-3 text-destructive mt-0.5" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="text-center p-2">
                              <div className="flex flex-col items-center gap-0.5">
                                {weekSavings > 0 && (
                                  <span className="text-[10px] text-success font-medium">
                                    Save ${weekSavings}
                                  </span>
                                )}
                                {weekGaps > 0 && (
                                  <span className="text-[10px] text-destructive font-medium">
                                    Gap ${weekGaps}
                                  </span>
                                )}
                                {weekSavings === 0 && weekGaps === 0 && (
                                  <span className="text-[10px] text-success">
                                    <CheckCircle2 className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
          </div>
        </FormSection>

        {/* Staff Leave Summary */}
        {leaveSummary.total > 0 && (
          <FormSection title="Staff Leave This Week">
            <div className="flex items-center gap-2 mb-3">
              <UserMinus className="h-4 w-4 text-warning" />
            </div>
            <div className="flex gap-2 flex-wrap">
                    {leaveSummary.sick > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <UserMinus className="h-3 w-3" />
                        {leaveSummary.sick} Sick Leave
                      </Badge>
                    )}
                    {leaveSummary.annual > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                        <Calendar className="h-3 w-3" />
                        {leaveSummary.annual} Annual Leave
                      </Badge>
                    )}
                    {leaveSummary.personal > 0 && (
                      <Badge variant="secondary">
                        {leaveSummary.personal} Personal Leave
                      </Badge>
                    )}
            </div>
          </FormSection>
        )}

        {/* Summary Insights */}
        <div className="grid grid-cols-3 gap-3">
              <InsightCard
                icon={<UserPlus className="h-5 w-5 text-warning" />}
                label="Overstaffed Days"
                value={weeklyTotals.daysOverstaffed}
                description="Days with excess staff"
                color="amber"
              />
              <InsightCard
                icon={<UserMinus className="h-5 w-5 text-destructive" />}
                label="Understaffed Days"
                value={weeklyTotals.daysUnderstaffed}
                description="Days needing coverage"
                color="red"
              />
              <InsightCard
                icon={<Target className="h-5 w-5 text-success" />}
                label="Optimal Days"
                value={weeklyTotals.daysOptimal}
                description="Perfectly staffed"
                color="green"
              />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}

function MetricCard({
  icon, 
  label, 
  value, 
  subValue,
  trend,
  color 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string;
  subValue: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'success' | 'warning' | 'error' | 'info';
}) {
  const colorMap = {
    success: { bg: 'bg-success/10', text: 'text-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
    error: { bg: 'bg-destructive/10', text: 'text-destructive' },
    info: { bg: 'bg-primary/10', text: 'text-primary' },
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg flex items-center justify-center", colorMap[color].bg, colorMap[color].text)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground">{subValue}</p>
        </div>
          {trend !== 'neutral' && (
            <div className={trend === 'up' ? 'text-success' : 'text-destructive'}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          )}
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  description,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  color: 'amber' | 'red' | 'green';
}) {
  const bgColors = {
    amber: 'bg-warning/10 border-warning/30',
    red: 'bg-destructive/10 border-destructive/30',
    green: 'bg-success/10 border-success/30',
  };
  
  const textColors = {
    amber: 'text-warning',
    red: 'text-destructive',
    green: 'text-success',
  };

  return (
    <div className={cn("rounded-lg border p-3 text-center", bgColors[color])}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={cn("text-2xl font-bold", textColors[color])}>{value}</div>
      <div className={cn("text-xs font-medium", textColors[color])}>{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>
    </div>
  );
}
