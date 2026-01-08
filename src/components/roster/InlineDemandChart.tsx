import { DemandAnalyticsData, StaffAbsence, DemandChartConfig } from '@/types/demandAnalytics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Users, UserMinus, UserPlus, AlertTriangle, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ComposedChart, Line } from 'recharts';

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

  const chartData = dayData.map(d => ({
    time: d.timeSlot.split('-')[0].slice(0, 2),
    fullTime: d.timeSlot,
    booked: d.bookedChildren,
    confirmed: d.confirmedBookings,
    casual: d.casualBookings,
    attendance: d.historicalAttendance,
    capacity: d.capacity,
    required: d.requiredStaff,
    scheduled: d.scheduledStaff,
    compliant: d.staffRatioCompliant,
    childAbsences: d.childAbsences,
  }));

  const avgUtilization = Math.round(dayData.reduce((sum, d) => sum + d.utilisationPercent, 0) / dayData.length);
  const totalBooked = dayData.reduce((sum, d) => sum + d.bookedChildren, 0);
  const totalAttendance = dayData.reduce((sum, d) => sum + d.historicalAttendance, 0);
  const hasRatioIssue = dayData.some(d => !d.staffRatioCompliant);
  const dayAbsences = absences.filter(a => a.date === date);
  
  // Staffing metrics
  const totalScheduled = dayData.reduce((sum, d) => sum + d.scheduledStaff, 0);
  const totalRequired = dayData.reduce((sum, d) => sum + d.requiredStaff, 0);
  const isOverstaffed = totalScheduled > totalRequired;
  const isUnderstaffed = totalScheduled < totalRequired;
  const staffDifference = totalScheduled - totalRequired;
  const hoursExcess = Math.max(0, staffDifference) * 3; // 3 hours per slot
  const hoursShortfall = Math.max(0, -staffDifference) * 3;
  const potentialSavings = hoursExcess * 30; // $30/hr estimate

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-1 p-1.5 bg-muted/30 rounded-md">
              {/* Mini sparkline chart */}
              <div className="h-6 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Area 
                      type="monotone" 
                      dataKey="booked" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      strokeWidth={1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="attendance" 
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2))" 
                      fillOpacity={0.5}
                      strokeWidth={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Quick stats row */}
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <span className={cn(
                  "font-medium",
                  avgUtilization >= 80 && "text-emerald-600",
                  avgUtilization < 50 && "text-amber-600"
                )}>
                  {avgUtilization}%
                </span>
                {isOverstaffed && (
                  <span className="flex items-center gap-0.5 text-amber-600">
                    <UserPlus className="h-2.5 w-2.5" />
                    +{hoursExcess}h
                  </span>
                )}
                {isUnderstaffed && (
                  <span className="flex items-center gap-0.5 text-destructive">
                    <UserMinus className="h-2.5 w-2.5" />
                    -{hoursShortfall}h
                  </span>
                )}
                {potentialSavings > 0 && (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <DollarSign className="h-2.5 w-2.5" />
                    ${potentialSavings}
                  </span>
                )}
                {hasRatioIssue && !isUnderstaffed && (
                  <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
                )}
                {dayAbsences.length > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-600">
                    <UserMinus className="h-2.5 w-2.5" />
                    {dayAbsences.length}
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="w-72 p-0">
            <DetailedChartTooltip 
              chartData={chartData}
              dayData={dayData}
              absences={dayAbsences}
              avgUtilization={avgUtilization}
              config={config}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded inline view
  return (
    <div className="bg-muted/30 rounded-lg p-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">Demand Analytics</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold",
            avgUtilization >= 80 && "text-emerald-600",
            avgUtilization >= 50 && avgUtilization < 80 && "text-foreground",
            avgUtilization < 50 && "text-amber-600"
          )}>
            {avgUtilization}% util
          </span>
          {isOverstaffed && (
            <span className="flex items-center gap-0.5 text-amber-600 text-[10px]">
              <UserPlus className="h-3 w-3" /> +{hoursExcess}h over
            </span>
          )}
          {isUnderstaffed && (
            <span className="flex items-center gap-0.5 text-destructive text-[10px]">
              <UserMinus className="h-3 w-3" /> -{hoursShortfall}h short
            </span>
          )}
          {potentialSavings > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-600 text-[10px]">
              <DollarSign className="h-3 w-3" /> ${potentialSavings} save
            </span>
          )}
          {hasRatioIssue && !isUnderstaffed && (
            <span className="flex items-center gap-0.5 text-destructive text-[10px]">
              <AlertTriangle className="h-3 w-3" /> Ratio
            </span>
          )}
        </div>
      </div>

      {/* Mixed chart: Bookings/Attendance as bars, Staff ratio as line */}
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 8 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 8 }} 
              axisLine={false}
              tickLine={false}
            />
            {config.showBookings && (
              <Bar 
                dataKey="booked" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.3}
                radius={[2, 2, 0, 0]}
                name="Booked"
              />
            )}
            {config.showAttendance && (
              <Bar 
                dataKey="attendance" 
                fill="hsl(var(--chart-2))" 
                radius={[2, 2, 0, 0]}
                name="Attendance"
              />
            )}
            {config.showRatios && (
              <>
                <Line 
                  type="step"
                  dataKey="required" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Required Staff"
                />
                <Line 
                  type="step"
                  dataKey="scheduled" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  dot={{ r: 2, fill: 'hsl(var(--chart-4))' }}
                  name="Scheduled Staff"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground">
        {config.showBookings && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-primary/30" /> Booked
          </span>
        )}
        {config.showAttendance && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'hsl(var(--chart-2))' }} /> Actual
          </span>
        )}
        {config.showRatios && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-t border-dashed border-destructive" /> Req Staff
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5" style={{ background: 'hsl(var(--chart-4))' }} /> Sched
            </span>
          </>
        )}
      </div>

      {/* Absences section */}
      {config.showAbsences && dayAbsences.length > 0 && (
        <div className="pt-1 border-t border-border">
          <div className="flex items-center gap-1 mb-1">
            <UserMinus className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-medium text-amber-600">
              {dayAbsences.length} Staff Absence{dayAbsences.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {dayAbsences.slice(0, 3).map((absence, idx) => (
              <span 
                key={idx}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full",
                  absence.type === 'sick' && "bg-red-100 text-red-700",
                  absence.type === 'annual' && "bg-blue-100 text-blue-700",
                  absence.type === 'personal' && "bg-purple-100 text-purple-700",
                  absence.type === 'other' && "bg-gray-100 text-gray-700"
                )}
              >
                {absence.staffName.split(' ')[0]} ({absence.type})
              </span>
            ))}
            {dayAbsences.length > 3 && (
              <span className="text-[9px] text-muted-foreground">+{dayAbsences.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailedChartTooltip({ 
  chartData, 
  dayData,
  absences,
  avgUtilization,
  config 
}: { 
  chartData: any[];
  dayData: DemandAnalyticsData[];
  absences: StaffAbsence[];
  avgUtilization: number;
  config: DemandChartConfig;
}) {
  const totalBooked = dayData.reduce((sum, d) => sum + d.bookedChildren, 0);
  const totalAttendance = dayData.reduce((sum, d) => sum + d.historicalAttendance, 0);
  const avgAttendanceRate = Math.round(dayData.reduce((sum, d) => sum + d.attendanceRate, 0) / dayData.length);
  
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Day Analytics</span>
        <span className={cn(
          "text-xs font-bold",
          avgUtilization >= 80 && "text-emerald-600",
          avgUtilization < 50 && "text-amber-600"
        )}>
          {avgUtilization}% avg utilization
        </span>
      </div>
      
      {/* Chart */}
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
            <Bar dataKey="booked" fill="hsl(var(--primary))" fillOpacity={0.3} radius={[2, 2, 0, 0]} />
            <Bar dataKey="attendance" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
            <Line type="step" dataKey="required" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            <Line type="step" dataKey="scheduled" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Booked:</span>
          <span className="font-medium">{Math.round(totalBooked / 4)} avg</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-muted-foreground">Attendance:</span>
          <span className="font-medium">{avgAttendanceRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-muted-foreground">Actual:</span>
          <span className="font-medium">{Math.round(totalAttendance / 4)} avg</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserMinus className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-muted-foreground">Absences:</span>
          <span className="font-medium">{absences.length} staff</span>
        </div>
      </div>

      {/* Absences detail */}
      {absences.length > 0 && (
        <div className="pt-2 border-t border-border">
          <span className="text-[10px] font-medium text-muted-foreground mb-1 block">Staff Absences</span>
          <div className="space-y-1">
            {absences.map((absence, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <span>{absence.staffName}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full capitalize",
                  absence.type === 'sick' && "bg-red-100 text-red-700",
                  absence.type === 'annual' && "bg-blue-100 text-blue-700",
                  absence.type === 'personal' && "bg-purple-100 text-purple-700"
                )}>
                  {absence.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
