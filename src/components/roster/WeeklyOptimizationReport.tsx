import { useMemo } from 'react';
import { StaffMember, Shift, Centre, Room, roleLabels, ageGroupLabels } from '@/types/roster';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import {
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  Box,
  Typography,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
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
  Shield
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    medium: 'text-amber-600',
    low: 'text-blue-600',
  };

  const typeIcons = {
    savings: PiggyBank,
    compliance: Shield,
    coverage: Users,
    efficiency: Zap,
  };

  const typeColors = {
    savings: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    compliance: 'bg-red-50 border-red-200 text-red-700',
    coverage: 'bg-amber-50 border-amber-200 text-amber-700',
    efficiency: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="!w-[95vw] sm:!w-[800px] md:!w-[1000px] lg:!w-[1100px] !max-w-[1100px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Weekly Optimization Report
          </SheetTitle>
          <SheetDescription>
            {centre.name} • {dates[0]?.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - {dates[dates.length - 1]?.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 h-[calc(100vh-160px)]">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
            
            {/* Key Metrics Overview */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
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
            </Box>

            {/* Budget Progress */}
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>Weekly Budget Usage</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    color={budgetUsage > 100 ? 'error.main' : budgetUsage > 90 ? 'warning.main' : 'success.main'}
                  >
                    {budgetUsage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(budgetUsage, 100)} 
                  color={budgetUsage > 100 ? 'error' : budgetUsage > 90 ? 'warning' : 'primary'}
                  sx={{ height: 10, borderRadius: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Est. Cost: ${Math.round(weeklyTotals.totalHoursScheduled * avgHourlyRate).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Budget: ${weeklyBudget.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <Card variant="outlined">
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      <Typography variant="subtitle1" fontWeight={600}>Optimization Recommendations</Typography>
                      <Chip label={`${recommendations.length} actions`} size="small" color="primary" />
                    </Box>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {recommendations.slice(0, 6).map(rec => {
                      const Icon = typeIcons[rec.type];
                      return (
                        <Box 
                          key={rec.id}
                          className={cn(
                            "rounded-lg border p-3",
                            typeColors[rec.type]
                          )}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                              <Icon className="h-4 w-4" />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>{rec.title}</Typography>
                                <Chip 
                                  label={rec.priority} 
                                  size="small" 
                                  sx={{ 
                                    height: 18, 
                                    fontSize: '0.65rem',
                                    bgcolor: rec.priority === 'high' ? 'error.light' : rec.priority === 'medium' ? 'warning.light' : 'info.light',
                                    color: rec.priority === 'high' ? 'error.dark' : rec.priority === 'medium' ? 'warning.dark' : 'info.dark',
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.9 }}>
                                {rec.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="caption" fontWeight={600}>
                                  {rec.impact}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7 }}>
                                  <ArrowRight className="h-3 w-3" />
                                  <Typography variant="caption">{rec.action}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Charts Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {/* Daily Staffing Chart */}
              <Card variant="outlined">
                <CardHeader 
                  title={<Typography variant="body2" fontWeight={500}>Daily Staffing Overview</Typography>} 
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Box sx={{ height: 200 }}>
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
                  </Box>
                </CardContent>
              </Card>

              {/* Room Efficiency Chart */}
              <Card variant="outlined">
                <CardHeader 
                  title={<Typography variant="body2" fontWeight={500}>Room Efficiency Comparison</Typography>} 
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Box sx={{ height: 200 }}>
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
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Room Detail Table */}
            <Card variant="outlined">
              <CardHeader 
                title={<Typography variant="body2" fontWeight={500}>Room-by-Day Breakdown</Typography>} 
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <table className="w-full text-xs">
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
                                    dayMetric.staffDiff > 0 && "bg-amber-50",
                                    dayMetric.staffDiff < 0 && "bg-red-50",
                                    dayMetric.staffDiff === 0 && "bg-emerald-50"
                                  )}>
                                    <span className={cn(
                                      "font-semibold text-sm",
                                      dayMetric.staffDiff > 0 && "text-amber-700",
                                      dayMetric.staffDiff < 0 && "text-red-700",
                                      dayMetric.staffDiff === 0 && "text-emerald-700"
                                    )}>
                                      {dayMetric.scheduledStaff}/{dayMetric.requiredStaff}
                                    </span>
                                    {dayMetric.staffDiff !== 0 && (
                                      <span className={cn(
                                        "text-[10px]",
                                        dayMetric.staffDiff > 0 && "text-amber-600",
                                        dayMetric.staffDiff < 0 && "text-red-600"
                                      )}>
                                        {dayMetric.staffDiff > 0 ? `+${dayMetric.staffDiff}` : dayMetric.staffDiff}
                                      </span>
                                    )}
                                    {!dayMetric.ratioCompliant && (
                                      <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="text-center p-2">
                              <div className="flex flex-col items-center gap-0.5">
                                {weekSavings > 0 && (
                                  <span className="text-[10px] text-emerald-600 font-medium">
                                    Save ${weekSavings}
                                  </span>
                                )}
                                {weekGaps > 0 && (
                                  <span className="text-[10px] text-red-600 font-medium">
                                    Gap ${weekGaps}
                                  </span>
                                )}
                                {weekSavings === 0 && weekGaps === 0 && (
                                  <span className="text-[10px] text-emerald-600">
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
                </Box>
              </CardContent>
            </Card>

            {/* Staff Leave Summary */}
            {leaveSummary.total > 0 && (
              <Card variant="outlined">
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserMinus className="h-4 w-4 text-amber-500" />
                      <Typography variant="body2" fontWeight={500}>Staff Leave This Week</Typography>
                    </Box>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {leaveSummary.sick > 0 && (
                      <Chip 
                        icon={<UserMinus className="h-3 w-3" />}
                        label={`${leaveSummary.sick} Sick Leave`} 
                        size="small"
                        sx={{ bgcolor: 'error.light', color: 'error.dark' }}
                      />
                    )}
                    {leaveSummary.annual > 0 && (
                      <Chip 
                        icon={<Calendar className="h-3 w-3" />}
                        label={`${leaveSummary.annual} Annual Leave`} 
                        size="small"
                        sx={{ bgcolor: 'info.light', color: 'info.dark' }}
                      />
                    )}
                    {leaveSummary.personal > 0 && (
                      <Chip 
                        label={`${leaveSummary.personal} Personal Leave`} 
                        size="small"
                        sx={{ bgcolor: 'secondary.light', color: 'secondary.dark' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Summary Insights */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              <InsightCard
                icon={<UserPlus className="h-5 w-5 text-amber-500" />}
                label="Overstaffed Days"
                value={weeklyTotals.daysOverstaffed}
                description="Days with excess staff"
                color="amber"
              />
              <InsightCard
                icon={<UserMinus className="h-5 w-5 text-red-500" />}
                label="Understaffed Days"
                value={weeklyTotals.daysUnderstaffed}
                description="Days needing coverage"
                color="red"
              />
              <InsightCard
                icon={<Target className="h-5 w-5 text-emerald-500" />}
                label="Optimal Days"
                value={weeklyTotals.daysOptimal}
                description="Perfectly staffed"
                color="green"
              />
            </Box>

          </Box>
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
    success: { bg: 'success.light', text: 'success.dark' },
    warning: { bg: 'warning.light', text: 'warning.dark' },
    error: { bg: 'error.light', text: 'error.dark' },
    info: { bg: 'info.light', text: 'info.dark' },
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1, 
            bgcolor: colorMap[color].bg,
            color: colorMap[color].text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {subValue}
            </Typography>
          </Box>
          {trend !== 'neutral' && (
            <Box sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
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
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    green: 'bg-emerald-50 border-emerald-200',
  };
  
  const textColors = {
    amber: 'text-amber-700',
    red: 'text-red-700',
    green: 'text-emerald-700',
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
