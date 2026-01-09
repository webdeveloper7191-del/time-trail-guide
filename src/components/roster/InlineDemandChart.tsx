import { DemandAnalyticsData, StaffAbsence, DemandChartConfig } from '@/types/demandAnalytics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Users, 
  UserMinus, 
  UserPlus, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Baby,
  UserX,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  ComposedChart, 
  Line,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';

interface InlineDemandChartProps {
  analyticsData: DemandAnalyticsData[];
  absences: StaffAbsence[];
  date: string;
  roomId: string;
  config?: DemandChartConfig;
  isCompact?: boolean;
}

const defaultConfig: DemandChartConfig = {
  showBookings: true,
  showAttendance: true,
  showRatios: true,
  showAbsences: true,
};

export function InlineDemandChart({ 
  analyticsData, 
  absences,
  date, 
  roomId, 
  config = defaultConfig,
  isCompact = false 
}: InlineDemandChartProps) {
  const dayData = analyticsData.filter(d => d.date === date && d.roomId === roomId);
  
  if (dayData.length === 0) return null;

  // Staff absences for this day
  const dayAbsences = absences.filter(a => a.date === date);
  const sickLeave = dayAbsences.filter(a => a.type === 'sick');
  const annualLeave = dayAbsences.filter(a => a.type === 'annual');

  // Calculate aggregated metrics
  const peakBooked = Math.max(...dayData.map(d => d.bookedChildren));
  const avgBooked = Math.round(dayData.reduce((sum, d) => sum + d.bookedChildren, 0) / dayData.length);
  const totalConfirmed = dayData.reduce((sum, d) => sum + d.confirmedBookings, 0);
  const totalCasual = dayData.reduce((sum, d) => sum + d.casualBookings, 0);
  const avgAttendance = Math.round(dayData.reduce((sum, d) => sum + d.historicalAttendance, 0) / dayData.length);
  const avgAttendanceRate = Math.round(dayData.reduce((sum, d) => sum + d.attendanceRate, 0) / dayData.length);
  const totalChildAbsences = dayData.reduce((sum, d) => sum + d.childAbsences, 0);
  
  const totalScheduled = dayData.reduce((sum, d) => sum + d.scheduledStaff, 0);
  const totalRequired = dayData.reduce((sum, d) => sum + d.requiredStaff, 0);
  const staffDifference = totalScheduled - totalRequired;
  const hoursExcess = Math.max(0, staffDifference) * 3;
  const hoursShortfall = Math.max(0, -staffDifference) * 3;
  const potentialSavings = hoursExcess * 30;
  
  const ratioCompliantSlots = dayData.filter(d => d.staffRatioCompliant).length;
  const ratioBreachSlots = dayData.filter(d => !d.staffRatioCompliant).length;
  const avgUtilization = Math.round(dayData.reduce((sum, d) => sum + d.utilisationPercent, 0) / dayData.length);

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
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-xl p-3 text-xs min-w-[200px]">
          <p className="font-semibold text-foreground mb-2 pb-1 border-b border-border">{data.fullTime}</p>
          <div className="space-y-2">
            {/* Children Section */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Children</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-1">
                <span className="text-muted-foreground">Booked:</span>
                <span className="font-medium text-right">{data.booked}</span>
                <span className="text-muted-foreground text-[10px]">• Confirmed:</span>
                <span className="text-right text-[10px]">{data.confirmed}</span>
                <span className="text-muted-foreground text-[10px]">• Casual:</span>
                <span className="text-right text-[10px]">{data.casual}</span>
                <span className="text-muted-foreground">Attended:</span>
                <span className="font-medium text-emerald-600 text-right">{data.attendance}</span>
                <span className="text-muted-foreground">Absent:</span>
                <span className="text-amber-600 text-right">{data.childAbsent}</span>
                <span className="text-muted-foreground">Rate:</span>
                <span className={cn(
                  "text-right font-medium",
                  data.attendanceRate >= 90 && "text-emerald-600",
                  data.attendanceRate < 90 && "text-amber-600"
                )}>{data.attendanceRate}%</span>
              </div>
            </div>
            
            {/* Staff Section */}
            <div className="border-t border-border pt-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Staffing</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-1">
                <span className="text-muted-foreground">Required:</span>
                <span className="font-medium text-right">{data.required}</span>
                <span className="text-muted-foreground">Scheduled:</span>
                <span className={cn(
                  "font-medium text-right",
                  data.scheduled >= data.required && "text-emerald-600",
                  data.scheduled < data.required && "text-destructive"
                )}>{data.scheduled}</span>
                <span className="text-muted-foreground">Ratio:</span>
                <span className={cn(
                  "font-medium text-right",
                  data.compliant && "text-emerald-600",
                  !data.compliant && "text-destructive"
                )}>
                  {data.compliant ? '✓ OK' : '✗ Breach'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isCompact) {
    // Compact view for week/fortnight/month views - shows key metrics with expandable tooltip
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-card border border-border rounded-md p-1.5 cursor-pointer hover:bg-muted/50 transition-colors">
              {/* Mini chart */}
              <div className="h-10 w-full mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Bar 
                      dataKey="booked" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      radius={[1, 1, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.compliant ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} 
                          fillOpacity={0.3}
                        />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="attendance" 
                      fill="hsl(var(--chart-2))" 
                      radius={[1, 1, 0, 0]}
                    />
                    <Line 
                      type="step"
                      dataKey="required" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={1}
                      strokeDasharray="2 1"
                      dot={false}
                    />
                    <Line 
                      type="step"
                      dataKey="scheduled" 
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Key metrics row */}
              <div className="grid grid-cols-4 gap-0.5 text-[8px]">
                <div className="text-center">
                  <span className="text-blue-600 font-bold">{avgBooked}</span>
                  <p className="text-muted-foreground">Book</p>
                </div>
                <div className="text-center">
                  <span className={cn(
                    "font-bold",
                    avgAttendanceRate >= 85 ? "text-emerald-600" : "text-amber-600"
                  )}>{avgAttendanceRate}%</span>
                  <p className="text-muted-foreground">Attend</p>
                </div>
                <div className="text-center">
                  <span className={cn(
                    "font-bold",
                    staffDifference > 0 && "text-amber-600",
                    staffDifference < 0 && "text-destructive",
                    staffDifference === 0 && "text-emerald-600"
                  )}>
                    {staffDifference > 0 ? `+${staffDifference}` : staffDifference}
                  </span>
                  <p className="text-muted-foreground">Staff</p>
                </div>
                <div className="text-center">
                  <span className={cn(
                    "font-bold",
                    ratioBreachSlots > 0 ? "text-destructive" : "text-emerald-600"
                  )}>
                    {ratioBreachSlots > 0 ? ratioBreachSlots : '✓'}
                  </span>
                  <p className="text-muted-foreground">Ratio</p>
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-border">
                {potentialSavings > 0 && (
                  <span className="flex items-center gap-0.5 text-[8px] text-emerald-600">
                    <DollarSign className="h-2.5 w-2.5" />${potentialSavings}
                  </span>
                )}
                {hoursShortfall > 0 && (
                  <span className="flex items-center gap-0.5 text-[8px] text-destructive">
                    <UserMinus className="h-2.5 w-2.5" />-{hoursShortfall}h
                  </span>
                )}
                {dayAbsences.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[8px] text-amber-600">
                    <UserX className="h-2.5 w-2.5" />{dayAbsences.length} leave
                  </span>
                )}
                {potentialSavings === 0 && hoursShortfall === 0 && dayAbsences.length === 0 && (
                  <span className="flex items-center gap-0.5 text-[8px] text-emerald-600">
                    <CheckCircle2 className="h-2.5 w-2.5" />Optimal
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="w-80 p-0">
            <ExpandedTooltipContent 
              chartData={chartData}
              dayData={dayData}
              absences={dayAbsences}
              metrics={{
                avgBooked,
                peakBooked,
                totalConfirmed,
                totalCasual,
                avgAttendance,
                avgAttendanceRate,
                totalChildAbsences,
                totalScheduled,
                totalRequired,
                staffDifference,
                hoursExcess,
                hoursShortfall,
                potentialSavings,
                ratioCompliantSlots,
                ratioBreachSlots,
                avgUtilization,
                sickLeave: sickLeave.length,
                annualLeave: annualLeave.length
              }}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded inline view for day view
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
                {ratioBreachSlots} ratio breach
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                All ratios compliant
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-2">
          <MetricCard
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Booked Children"
            value={avgBooked}
            subLabel={`Peak: ${peakBooked}`}
            color="blue"
          />
          <MetricCard
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Attendance Rate"
            value={`${avgAttendanceRate}%`}
            subLabel={`${avgAttendance} avg attended`}
            color={avgAttendanceRate >= 85 ? "green" : "amber"}
          />
          <MetricCard
            icon={<Baby className="h-3.5 w-3.5" />}
            label="Child Absences"
            value={totalChildAbsences}
            subLabel="Late arrivals/departures"
            color={totalChildAbsences > 0 ? "amber" : "gray"}
          />
          <MetricCard
            icon={<UserX className="h-3.5 w-3.5" />}
            label="Staff on Leave"
            value={dayAbsences.length}
            subLabel={`${sickLeave.length} sick, ${annualLeave.length} annual`}
            color={dayAbsences.length > 0 ? "red" : "gray"}
          />
        </div>

        {/* Chart */}
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                label={{ value: 'Children', angle: -90, position: 'insideLeft', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
                label={{ value: 'Staff', angle: 90, position: 'insideRight', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              
              {/* Children bars */}
              <Bar 
                yAxisId="left"
                dataKey="booked" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.3}
                radius={[2, 2, 0, 0]}
                name="Booked Children"
              />
              <Bar 
                yAxisId="left"
                dataKey="attendance" 
                fill="hsl(var(--chart-2))" 
                radius={[2, 2, 0, 0]}
                name="Actual Attendance"
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

        {/* Optimization Opportunities */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-foreground">Optimization Opportunities</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <OptimizationCard
              type={staffDifference > 0 ? 'overstaffed' : staffDifference < 0 ? 'understaffed' : 'optimal'}
              value={staffDifference > 0 ? `+${hoursExcess}h` : staffDifference < 0 ? `-${hoursShortfall}h` : 'Balanced'}
              label={staffDifference > 0 ? 'Overstaffed' : staffDifference < 0 ? 'Understaffed' : 'Optimal Staffing'}
            />
            <OptimizationCard
              type={potentialSavings > 0 ? 'savings' : 'neutral'}
              value={`$${potentialSavings}`}
              label="Potential Savings"
            />
            <OptimizationCard
              type={ratioBreachSlots > 0 ? 'warning' : 'success'}
              value={`${ratioCompliantSlots}/${dayData.length}`}
              label="Ratio Compliant"
            />
          </div>
        </div>

        {/* Staff Absences Detail */}
        {dayAbsences.length > 0 && (
          <div className="border-t border-border pt-3">
            <span className="text-[10px] font-semibold text-foreground mb-2 block">Staff on Leave Today</span>
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
                  {absence.staffName}
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

function MetricCard({ 
  icon, 
  label, 
  value, 
  subLabel,
  color 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string | number; 
  subLabel?: string;
  color: 'blue' | 'gray' | 'amber' | 'red' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className={cn("rounded-md border p-2", colorClasses[color])}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-medium opacity-80">{label}</span>
      </div>
      <span className="text-lg font-bold block">{value}</span>
      {subLabel && (
        <span className="text-[9px] opacity-70 block">{subLabel}</span>
      )}
    </div>
  );
}

function OptimizationCard({
  type,
  value,
  label
}: {
  type: 'overstaffed' | 'understaffed' | 'optimal' | 'savings' | 'neutral' | 'warning' | 'success';
  value: string;
  label: string;
}) {
  const styles = {
    overstaffed: 'bg-amber-50 border-amber-200 text-amber-700',
    understaffed: 'bg-red-50 border-red-200 text-red-700',
    optimal: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    savings: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    neutral: 'bg-gray-50 border-gray-200 text-gray-500',
    warning: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };

  const icons = {
    overstaffed: <UserPlus className="h-4 w-4" />,
    understaffed: <UserMinus className="h-4 w-4" />,
    optimal: <Users className="h-4 w-4" />,
    savings: <DollarSign className="h-4 w-4" />,
    neutral: <DollarSign className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    success: <CheckCircle2 className="h-4 w-4" />,
  };

  return (
    <div className={cn("rounded-md border p-2 text-center", styles[type])}>
      <div className="flex items-center justify-center mb-1">
        {icons[type]}
      </div>
      <span className="text-sm font-bold block">{value}</span>
      <span className="text-[9px] opacity-80 block">{label}</span>
    </div>
  );
}

interface ExpandedTooltipContentProps {
  chartData: any[];
  dayData: DemandAnalyticsData[];
  absences: StaffAbsence[];
  metrics: {
    avgBooked: number;
    peakBooked: number;
    totalConfirmed: number;
    totalCasual: number;
    avgAttendance: number;
    avgAttendanceRate: number;
    totalChildAbsences: number;
    totalScheduled: number;
    totalRequired: number;
    staffDifference: number;
    hoursExcess: number;
    hoursShortfall: number;
    potentialSavings: number;
    ratioCompliantSlots: number;
    ratioBreachSlots: number;
    avgUtilization: number;
    sickLeave: number;
    annualLeave: number;
  };
}

function ExpandedTooltipContent({ chartData, dayData, absences, metrics }: ExpandedTooltipContentProps) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xs font-semibold">Detailed Analytics</span>
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded",
          metrics.ratioBreachSlots > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
        )}>
          {metrics.ratioBreachSlots > 0 ? `${metrics.ratioBreachSlots} ratio breach` : 'All compliant'}
        </span>
      </div>
      
      {/* Children Section */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Baby className="h-3 w-3" /> Children
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pl-1">
          <span className="text-muted-foreground">Avg Booked:</span>
          <span className="font-medium text-right">{metrics.avgBooked} (peak: {metrics.peakBooked})</span>
          <span className="text-muted-foreground">Confirmed:</span>
          <span className="text-right">{Math.round(metrics.totalConfirmed / dayData.length)}</span>
          <span className="text-muted-foreground">Casual:</span>
          <span className="text-right">{Math.round(metrics.totalCasual / dayData.length)}</span>
          <span className="text-muted-foreground">Attendance Rate:</span>
          <span className={cn(
            "font-medium text-right",
            metrics.avgAttendanceRate >= 85 ? "text-emerald-600" : "text-amber-600"
          )}>{metrics.avgAttendanceRate}%</span>
          <span className="text-muted-foreground">Avg Attended:</span>
          <span className="text-emerald-600 text-right">{metrics.avgAttendance}</span>
          <span className="text-muted-foreground">Child Absences:</span>
          <span className="text-amber-600 text-right">{metrics.totalChildAbsences}</span>
        </div>
      </div>

      {/* Staff Section */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Users className="h-3 w-3" /> Staffing
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pl-1">
          <span className="text-muted-foreground">Total Scheduled:</span>
          <span className="font-medium text-right">{metrics.totalScheduled} staff-slots</span>
          <span className="text-muted-foreground">Total Required:</span>
          <span className="text-right">{metrics.totalRequired} staff-slots</span>
          <span className="text-muted-foreground">Balance:</span>
          <span className={cn(
            "font-medium text-right",
            metrics.staffDifference > 0 && "text-amber-600",
            metrics.staffDifference < 0 && "text-red-600",
            metrics.staffDifference === 0 && "text-emerald-600"
          )}>
            {metrics.staffDifference > 0 ? `+${metrics.hoursExcess}h over` : 
             metrics.staffDifference < 0 ? `-${metrics.hoursShortfall}h short` : 'Optimal'}
          </span>
          <span className="text-muted-foreground">Staff on Leave:</span>
          <span className="text-amber-600 text-right">
            {absences.length} ({metrics.sickLeave} sick, {metrics.annualLeave} annual)
          </span>
        </div>
      </div>

      {/* Optimization */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <DollarSign className="h-3 w-3" /> Optimization
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pl-1">
          <span className="text-muted-foreground">Potential Savings:</span>
          <span className={cn(
            "font-medium text-right",
            metrics.potentialSavings > 0 ? "text-emerald-600" : "text-gray-500"
          )}>${metrics.potentialSavings}</span>
          <span className="text-muted-foreground">Ratio Compliance:</span>
          <span className={cn(
            "font-medium text-right",
            metrics.ratioBreachSlots > 0 ? "text-red-600" : "text-emerald-600"
          )}>{metrics.ratioCompliantSlots}/{dayData.length} slots</span>
        </div>
      </div>

      {/* Time Slot Breakdown */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2">Time Slot Breakdown</p>
        <div className="flex gap-1">
          {chartData.map((slot, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex-1 h-5 rounded-sm flex items-center justify-center text-[8px] font-medium",
                slot.scheduled >= slot.required && "bg-emerald-100 text-emerald-700",
                slot.scheduled < slot.required && "bg-red-100 text-red-700"
              )}
            >
              {slot.scheduled}/{slot.required}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
        </div>
      </div>

      {/* Staff Absences */}
      {absences.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Staff on Leave</p>
          <div className="flex flex-wrap gap-1">
            {absences.map((absence, idx) => (
              <span 
                key={idx}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full",
                  absence.type === 'sick' && "bg-red-100 text-red-700",
                  absence.type === 'annual' && "bg-blue-100 text-blue-700",
                  absence.type === 'personal' && "bg-purple-100 text-purple-700"
                )}
              >
                {absence.staffName.split(' ')[0]} ({absence.type})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
