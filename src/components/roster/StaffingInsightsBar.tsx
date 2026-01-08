import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserMinus, 
  UserPlus,
  AlertTriangle, 
  Clock,
  DollarSign,
  Lightbulb
} from 'lucide-react';

interface StaffingInsight {
  type: 'overstaffed' | 'understaffed' | 'optimal' | 'optimization';
  timeSlot: string;
  scheduledStaff: number;
  requiredStaff: number;
  difference: number;
  estimatedCost?: number;
  potentialSavings?: number;
}

interface StaffingInsightsBarProps {
  analyticsData: DemandAnalyticsData[];
  absences: StaffAbsence[];
  date: string;
  roomId?: string;
  centreId?: string;
  hourlyRate?: number;
  isCompact?: boolean;
}

export function StaffingInsightsBar({
  analyticsData,
  absences,
  date,
  roomId,
  centreId,
  hourlyRate = 30,
  isCompact = false
}: StaffingInsightsBarProps) {
  // Filter data for the specific context
  let dayData = analyticsData.filter(d => d.date === date);
  if (roomId) dayData = dayData.filter(d => d.roomId === roomId);
  if (centreId) dayData = dayData.filter(d => d.centreId === centreId);
  
  if (dayData.length === 0) return null;

  // Calculate staffing insights
  const insights: StaffingInsight[] = dayData.map(d => {
    const difference = d.scheduledStaff - d.requiredStaff;
    const hoursInSlot = 3; // Each slot is 3 hours
    
    let type: StaffingInsight['type'] = 'optimal';
    if (difference > 0) type = 'overstaffed';
    else if (difference < 0) type = 'understaffed';
    
    return {
      type,
      timeSlot: d.timeSlot,
      scheduledStaff: d.scheduledStaff,
      requiredStaff: d.requiredStaff,
      difference,
      estimatedCost: d.scheduledStaff * hourlyRate * hoursInSlot,
      potentialSavings: difference > 0 ? difference * hourlyRate * hoursInSlot : 0,
    };
  });

  // Aggregate metrics
  const totalScheduledHours = dayData.reduce((sum, d) => sum + d.scheduledStaff * 3, 0);
  const totalRequiredHours = dayData.reduce((sum, d) => sum + d.requiredStaff * 3, 0);
  const overstaffedSlots = insights.filter(i => i.type === 'overstaffed').length;
  const understaffedSlots = insights.filter(i => i.type === 'understaffed').length;
  const totalPotentialSavings = insights.reduce((sum, i) => sum + (i.potentialSavings || 0), 0);
  const excessHours = Math.max(0, totalScheduledHours - totalRequiredHours);
  const shortfallHours = Math.max(0, totalRequiredHours - totalScheduledHours);
  
  const dayAbsences = absences.filter(a => a.date === date && (!centreId || a.centreId === centreId));

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md text-[10px]">
              {overstaffedSlots > 0 && (
                <span className="flex items-center gap-0.5 text-amber-600">
                  <UserPlus className="h-3 w-3" />
                  +{excessHours}h
                </span>
              )}
              {understaffedSlots > 0 && (
                <span className="flex items-center gap-0.5 text-destructive">
                  <UserMinus className="h-3 w-3" />
                  -{shortfallHours}h
                </span>
              )}
              {overstaffedSlots === 0 && understaffedSlots === 0 && (
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <Users className="h-3 w-3" />
                  Optimal
                </span>
              )}
              {totalPotentialSavings > 0 && (
                <span className="flex items-center gap-0.5 text-blue-600">
                  <DollarSign className="h-3 w-3" />
                  ${totalPotentialSavings}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64">
            <StaffingInsightsDetail 
              insights={insights}
              totalScheduledHours={totalScheduledHours}
              totalRequiredHours={totalRequiredHours}
              totalPotentialSavings={totalPotentialSavings}
              absences={dayAbsences}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          Staffing Insights
        </span>
        <div className="flex items-center gap-2">
          {dayAbsences.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
              {dayAbsences.length} absent
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          label="Scheduled"
          value={`${totalScheduledHours}h`}
          icon={<Clock className="h-3.5 w-3.5" />}
          color="blue"
        />
        <MetricCard
          label="Required"
          value={`${totalRequiredHours}h`}
          icon={<Users className="h-3.5 w-3.5" />}
          color="gray"
        />
        <MetricCard
          label={excessHours > 0 ? "Overstaffed" : shortfallHours > 0 ? "Understaffed" : "Balance"}
          value={excessHours > 0 ? `+${excessHours}h` : shortfallHours > 0 ? `-${shortfallHours}h` : "0h"}
          icon={excessHours > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : shortfallHours > 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
          color={excessHours > 0 ? "amber" : shortfallHours > 0 ? "red" : "green"}
        />
        <MetricCard
          label="Potential Save"
          value={`$${totalPotentialSavings}`}
          icon={<DollarSign className="h-3.5 w-3.5" />}
          color={totalPotentialSavings > 0 ? "green" : "gray"}
        />
      </div>

      {/* Time Slot Breakdown */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-medium text-muted-foreground">Time Slot Analysis</span>
        <div className="flex gap-1">
          {insights.map((insight, idx) => (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "flex-1 h-6 rounded-sm flex items-center justify-center text-[9px] font-medium cursor-pointer transition-all hover:scale-105",
                      insight.type === 'overstaffed' && "bg-amber-100 text-amber-700 border border-amber-300",
                      insight.type === 'understaffed' && "bg-red-100 text-red-700 border border-red-300",
                      insight.type === 'optimal' && "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    )}
                  >
                    {insight.type === 'overstaffed' && `+${insight.difference}`}
                    {insight.type === 'understaffed' && insight.difference}
                    {insight.type === 'optimal' && '✓'}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{insight.timeSlot}</p>
                    <p>Scheduled: {insight.scheduledStaff} staff</p>
                    <p>Required: {insight.requiredStaff} staff</p>
                    {insight.potentialSavings! > 0 && (
                      <p className="text-emerald-600">Potential savings: ${insight.potentialSavings}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
        </div>
      </div>

      {/* Optimization Suggestions */}
      {(excessHours > 0 || shortfallHours > 0) && (
        <div className="pt-2 border-t border-border">
          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Optimization Opportunities</span>
          <div className="space-y-1">
            {excessHours > 0 && (
              <div className="flex items-start gap-2 text-[10px] bg-amber-50 text-amber-800 rounded p-1.5">
                <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Consider reducing {excessHours} hours of overstaffing to save ${totalPotentialSavings}</span>
              </div>
            )}
            {shortfallHours > 0 && (
              <div className="flex items-start gap-2 text-[10px] bg-red-50 text-red-800 rounded p-1.5">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Add {shortfallHours} hours of coverage to meet ratio requirements</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  color: 'blue' | 'gray' | 'amber' | 'red' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className={cn("rounded-md border p-1.5 text-center", colorClasses[color])}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className="text-xs font-semibold">{value}</span>
      </div>
      <span className="text-[9px] opacity-80">{label}</span>
    </div>
  );
}

function StaffingInsightsDetail({ 
  insights, 
  totalScheduledHours, 
  totalRequiredHours, 
  totalPotentialSavings,
  absences 
}: { 
  insights: StaffingInsight[];
  totalScheduledHours: number;
  totalRequiredHours: number;
  totalPotentialSavings: number;
  absences: StaffAbsence[];
}) {
  const overstaffed = insights.filter(i => i.type === 'overstaffed');
  const understaffed = insights.filter(i => i.type === 'understaffed');

  return (
    <div className="p-2 space-y-2 text-xs">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total Scheduled:</span>
        <span className="font-medium">{totalScheduledHours} hours</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total Required:</span>
        <span className="font-medium">{totalRequiredHours} hours</span>
      </div>
      
      {overstaffed.length > 0 && (
        <div className="pt-1 border-t border-border">
          <span className="text-amber-600 font-medium">Overstaffed Slots:</span>
          {overstaffed.map((o, i) => (
            <div key={i} className="flex justify-between text-[10px] mt-0.5">
              <span>{o.timeSlot}</span>
              <span>+{o.difference} staff (${o.potentialSavings} savings)</span>
            </div>
          ))}
        </div>
      )}

      {understaffed.length > 0 && (
        <div className="pt-1 border-t border-border">
          <span className="text-red-600 font-medium">Understaffed Slots:</span>
          {understaffed.map((u, i) => (
            <div key={i} className="flex justify-between text-[10px] mt-0.5">
              <span>{u.timeSlot}</span>
              <span className="text-red-600">{u.difference} staff needed</span>
            </div>
          ))}
        </div>
      )}

      {totalPotentialSavings > 0 && (
        <div className="pt-1 border-t border-border text-emerald-600">
          <span className="font-medium">Optimization potential: ${totalPotentialSavings}</span>
        </div>
      )}

      {absences.length > 0 && (
        <div className="pt-1 border-t border-border">
          <span className="text-amber-600 font-medium">{absences.length} Staff Absences</span>
        </div>
      )}
    </div>
  );
}
