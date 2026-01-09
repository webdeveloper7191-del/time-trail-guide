import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { cn } from '@/lib/utils';
import { 
  Users, 
  UserMinus, 
  UserPlus, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Baby,
  UserX,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
  Tooltip as RechartsTooltip
} from 'recharts';

interface RoomAnalyticsCardProps {
  analyticsData: DemandAnalyticsData[];
  absences: StaffAbsence[];
  date: string;
  roomId: string;
  hourlyRate?: number;
}

export function RoomAnalyticsCard({
  analyticsData,
  absences,
  date,
  roomId,
  hourlyRate = 30
}: RoomAnalyticsCardProps) {
  const dayData = analyticsData.filter(d => d.date === date && d.roomId === roomId);
  
  if (dayData.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-3 text-center">
        <span className="text-xs text-muted-foreground">No data available</span>
      </div>
    );
  }

  // Staff absences for this day
  const dayAbsences = absences.filter(a => a.date === date);
  const sickLeave = dayAbsences.filter(a => a.type === 'sick');
  const annualLeave = dayAbsences.filter(a => a.type === 'annual');
  const otherLeave = dayAbsences.filter(a => a.type === 'personal' || a.type === 'other');

  // Calculate aggregated metrics
  const totalBooked = dayData.reduce((sum, d) => sum + d.bookedChildren, 0);
  const totalConfirmed = dayData.reduce((sum, d) => sum + d.confirmedBookings, 0);
  const totalCasual = dayData.reduce((sum, d) => sum + d.casualBookings, 0);
  const totalAttendance = dayData.reduce((sum, d) => sum + d.historicalAttendance, 0);
  const avgAttendanceRate = Math.round(dayData.reduce((sum, d) => sum + d.attendanceRate, 0) / dayData.length);
  const totalChildAbsences = dayData.reduce((sum, d) => sum + d.childAbsences, 0);
  
  const totalScheduled = dayData.reduce((sum, d) => sum + d.scheduledStaff, 0);
  const totalRequired = dayData.reduce((sum, d) => sum + d.requiredStaff, 0);
  const staffDifference = totalScheduled - totalRequired;
  const hoursExcess = Math.max(0, staffDifference) * 3;
  const hoursShortfall = Math.max(0, -staffDifference) * 3;
  const potentialSavings = hoursExcess * hourlyRate;
  
  const ratioCompliantSlots = dayData.filter(d => d.staffRatioCompliant).length;
  const ratioBreachSlots = dayData.filter(d => !d.staffRatioCompliant).length;

  // Prepare chart data
  const chartData = dayData.map(d => ({
    time: d.timeSlot.split('-')[0],
    fullTime: d.timeSlot,
    booked: d.bookedChildren,
    confirmed: d.confirmedBookings,
    casual: d.casualBookings,
    attendance: d.historicalAttendance,
    childAbsent: d.childAbsences,
    required: d.requiredStaff,
    scheduled: d.scheduledStaff,
    compliant: d.staffRatioCompliant,
    capacity: d.capacity,
    attendanceRate: d.attendanceRate
  }));

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold text-foreground mb-2">{data.fullTime}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Booked Children:</span>
              <span className="font-medium">{data.booked}</span>
            </div>
            <div className="flex justify-between gap-4 pl-2 text-[10px]">
              <span className="text-muted-foreground">↳ Confirmed:</span>
              <span>{data.confirmed}</span>
            </div>
            <div className="flex justify-between gap-4 pl-2 text-[10px]">
              <span className="text-muted-foreground">↳ Casual:</span>
              <span>{data.casual}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Actual Attendance:</span>
              <span className="font-medium text-emerald-600">{data.attendance}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Attendance Rate:</span>
              <span className={cn(
                "font-medium",
                data.attendanceRate >= 90 && "text-emerald-600",
                data.attendanceRate < 90 && data.attendanceRate >= 80 && "text-amber-600",
                data.attendanceRate < 80 && "text-destructive"
              )}>{data.attendanceRate}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Children Absent:</span>
              <span className="text-amber-600">{data.childAbsent}</span>
            </div>
            <div className="border-t border-border my-2 pt-2">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Staff Required:</span>
                <span className="font-medium">{data.required}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Staff Scheduled:</span>
                <span className={cn(
                  "font-medium",
                  data.scheduled >= data.required && "text-emerald-600",
                  data.scheduled < data.required && "text-destructive"
                )}>{data.scheduled}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ratio Status:</span>
                <span className={cn(
                  "font-medium",
                  data.compliant && "text-emerald-600",
                  !data.compliant && "text-destructive"
                )}>
                  {data.compliant ? '✓ Compliant' : '✗ Breach'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/30 px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Daily Analytics</span>
          <div className="flex items-center gap-2">
            {ratioBreachSlots > 0 ? (
              <span className="flex items-center gap-1 text-[10px] text-destructive">
                <XCircle className="h-3 w-3" />
                {ratioBreachSlots} breach
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Compliant
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        {/* Children Metrics Row */}
        <div className="grid grid-cols-4 gap-2">
          <MetricBox
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Booked"
            value={Math.round(totalBooked / dayData.length)}
            subValue={`${totalConfirmed / dayData.length | 0} conf / ${totalCasual / dayData.length | 0} cas`}
            color="blue"
          />
          <MetricBox
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Attendance"
            value={`${avgAttendanceRate}%`}
            subValue={`${Math.round(totalAttendance / dayData.length)} avg`}
            color={avgAttendanceRate >= 85 ? "green" : "amber"}
          />
          <MetricBox
            icon={<Baby className="h-3.5 w-3.5" />}
            label="Child Absent"
            value={Math.round(totalChildAbsences / dayData.length)}
            subValue="late sign-out"
            color={totalChildAbsences > 0 ? "amber" : "gray"}
          />
          <MetricBox
            icon={<UserX className="h-3.5 w-3.5" />}
            label="Staff Leave"
            value={dayAbsences.length}
            subValue={`${sickLeave.length} sick / ${annualLeave.length} ann`}
            color={dayAbsences.length > 0 ? "red" : "gray"}
          />
        </div>

        {/* Chart */}
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 9 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 9 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9 }} 
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              
              {/* Children bars */}
              <Bar 
                yAxisId="left"
                dataKey="booked" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.3}
                radius={[2, 2, 0, 0]}
                name="Booked"
              />
              <Bar 
                yAxisId="left"
                dataKey="attendance" 
                fill="hsl(var(--chart-2))" 
                radius={[2, 2, 0, 0]}
                name="Attendance"
              />
              
              {/* Staff lines */}
              <Line 
                yAxisId="right"
                type="step"
                dataKey="required" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                name="Required Staff"
              />
              <Line 
                yAxisId="right"
                type="step"
                dataKey="scheduled" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--chart-4))' }}
                name="Scheduled Staff"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-primary/30" /> Booked Children
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm" style={{ background: 'hsl(var(--chart-2))' }} /> Actual Attendance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-destructive" /> Required Staff
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5" style={{ background: 'hsl(var(--chart-4))' }} /> Scheduled Staff
          </span>
        </div>

        {/* Staffing Analysis */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-foreground">Staffing Analysis</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className={cn(
              "rounded-md p-2 text-center",
              staffDifference > 0 && "bg-amber-50 border border-amber-200",
              staffDifference < 0 && "bg-red-50 border border-red-200",
              staffDifference === 0 && "bg-emerald-50 border border-emerald-200"
            )}>
              <div className="flex items-center justify-center gap-1 mb-1">
                {staffDifference > 0 ? (
                  <UserPlus className="h-4 w-4 text-amber-600" />
                ) : staffDifference < 0 ? (
                  <UserMinus className="h-4 w-4 text-red-600" />
                ) : (
                  <Users className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <span className={cn(
                "text-sm font-bold",
                staffDifference > 0 && "text-amber-700",
                staffDifference < 0 && "text-red-700",
                staffDifference === 0 && "text-emerald-700"
              )}>
                {staffDifference > 0 ? `+${hoursExcess}h` : staffDifference < 0 ? `-${hoursShortfall}h` : 'Optimal'}
              </span>
              <p className={cn(
                "text-[9px]",
                staffDifference > 0 && "text-amber-600",
                staffDifference < 0 && "text-red-600",
                staffDifference === 0 && "text-emerald-600"
              )}>
                {staffDifference > 0 ? 'Overstaffed' : staffDifference < 0 ? 'Understaffed' : 'Balanced'}
              </p>
            </div>

            <div className={cn(
              "rounded-md p-2 text-center",
              potentialSavings > 0 ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200"
            )}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className={cn(
                  "h-4 w-4",
                  potentialSavings > 0 ? "text-emerald-600" : "text-gray-400"
                )} />
              </div>
              <span className={cn(
                "text-sm font-bold",
                potentialSavings > 0 ? "text-emerald-700" : "text-gray-500"
              )}>
                ${potentialSavings}
              </span>
              <p className={cn(
                "text-[9px]",
                potentialSavings > 0 ? "text-emerald-600" : "text-gray-400"
              )}>
                Optimization
              </p>
            </div>

            <div className={cn(
              "rounded-md p-2 text-center",
              ratioBreachSlots > 0 ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"
            )}>
              <div className="flex items-center justify-center gap-1 mb-1">
                {ratioBreachSlots > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <span className={cn(
                "text-sm font-bold",
                ratioBreachSlots > 0 ? "text-red-700" : "text-emerald-700"
              )}>
                {ratioCompliantSlots}/{dayData.length}
              </span>
              <p className={cn(
                "text-[9px]",
                ratioBreachSlots > 0 ? "text-red-600" : "text-emerald-600"
              )}>
                Ratio Compliant
              </p>
            </div>
          </div>
        </div>

        {/* Staff Absences Detail */}
        {dayAbsences.length > 0 && (
          <div className="border-t border-border pt-3">
            <span className="text-[10px] font-semibold text-foreground mb-2 block">Staff on Leave</span>
            <div className="flex flex-wrap gap-1.5">
              {dayAbsences.map((absence, idx) => (
                <span 
                  key={idx}
                  className={cn(
                    "text-[9px] px-2 py-1 rounded-full flex items-center gap-1",
                    absence.type === 'sick' && "bg-red-100 text-red-700",
                    absence.type === 'annual' && "bg-blue-100 text-blue-700",
                    absence.type === 'personal' && "bg-purple-100 text-purple-700",
                    absence.type === 'other' && "bg-gray-100 text-gray-700"
                  )}
                >
                  <UserMinus className="h-2.5 w-2.5" />
                  {absence.staffName.split(' ')[0]}
                  <span className="opacity-70 capitalize">({absence.type})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({ 
  icon, 
  label, 
  value, 
  subValue,
  color 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string | number; 
  subValue?: string;
  color: 'blue' | 'gray' | 'amber' | 'red' | 'green';
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-500',
    amber: 'text-amber-600',
    red: 'text-red-600',
    green: 'text-emerald-600',
  };

  return (
    <div className="text-center">
      <div className={cn("flex items-center justify-center mb-0.5", colorClasses[color])}>
        {icon}
      </div>
      <span className={cn("text-sm font-bold block", colorClasses[color])}>{value}</span>
      <span className="text-[9px] text-muted-foreground block">{label}</span>
      {subValue && (
        <span className="text-[8px] text-muted-foreground/70 block">{subValue}</span>
      )}
    </div>
  );
}
