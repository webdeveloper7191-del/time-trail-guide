import { StaffMember, Shift, Centre, roleLabels } from '@/types/roster';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  PieChart
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { cn } from '@/lib/utils';

interface WeeklySummaryDashboardProps {
  shifts: Shift[];
  staff: StaffMember[];
  centre: Centre;
  dates: Date[];
  weeklyBudget: number;
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklySummaryDashboard({ 
  shifts, 
  staff, 
  centre, 
  dates, 
  weeklyBudget, 
  isOpen, 
  onClose 
}: WeeklySummaryDashboardProps) {
  const centreShifts = shifts.filter(s => s.centreId === centre.id);
  
  let totalHours = 0;
  let regularCost = 0;
  let overtimeCost = 0;
  const staffHours: Record<string, number> = {};
  
  centreShifts.forEach(shift => {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
    staffHours[shift.staffId] = (staffHours[shift.staffId] || 0) + hours;
    totalHours += hours;
  });

  Object.entries(staffHours).forEach(([staffId, hours]) => {
    const member = staff.find(s => s.id === staffId);
    if (member) {
      const regHours = Math.min(hours, member.maxHoursPerWeek);
      const otHours = Math.max(0, hours - member.maxHoursPerWeek);
      regularCost += regHours * member.hourlyRate;
      overtimeCost += otHours * member.overtimeRate;
    }
  });

  const totalCost = regularCost + overtimeCost;
  const budgetUsage = (totalCost / weeklyBudget) * 100;

  const statusCounts = {
    draft: centreShifts.filter(s => s.status === 'draft').length,
    published: centreShifts.filter(s => s.status === 'published').length,
    confirmed: centreShifts.filter(s => s.status === 'confirmed').length,
    completed: centreShifts.filter(s => s.status === 'completed').length,
  };

  const statusData = [
    { name: 'Draft', value: statusCounts.draft, color: '#f59e0b' },
    { name: 'Published', value: statusCounts.published, color: '#0ea5e9' },
    { name: 'Confirmed', value: statusCounts.confirmed, color: '#22c55e' },
    { name: 'Completed', value: statusCounts.completed, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const hoursByRole: Record<string, number> = {};
  centreShifts.forEach(shift => {
    const member = staff.find(s => s.id === shift.staffId);
    if (member) {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      hoursByRole[member.role] = (hoursByRole[member.role] || 0) + hours;
    }
  });

  const roleData = Object.entries(hoursByRole).map(([role, hours]) => ({
    role: roleLabels[role as keyof typeof roleLabels] || role,
    hours: Math.round(hours * 10) / 10,
  }));

  const activeStaffCount = Object.keys(staffHours).length;
  const totalStaffCount = staff.length;

  return (
    <PrimaryOffCanvas
      open={isOpen}
      onClose={onClose}
      title={`Weekly Summary - ${centre.name}`}
      description="Overview of hours, costs, and staffing for the current period"
      icon={PieChart}
      size="2xl"
      showFooter={false}
    >
      <div className="space-y-4">
        {/* Key Metrics */}
        <FormSection title="Key Metrics">
          <div className="grid grid-cols-2 gap-3">
              {[
              { icon: Clock, label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, bgColor: 'bg-primary/10' },
              { icon: DollarSign, label: 'Total Cost', value: `$${totalCost.toFixed(0)}`, bgColor: 'bg-success/10' },
              { icon: Users, label: 'Staff Rostered', value: `${activeStaffCount}/${totalStaffCount}`, bgColor: 'bg-secondary/10' },
              { icon: Calendar, label: 'Total Shifts', value: centreShifts.length.toString(), bgColor: 'bg-warning/10' },
            ].map((metric, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                  <metric.icon size={18} className="text-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-bold">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>
        </FormSection>

        {/* Budget Progress */}
        <FormSection title="Budget Usage">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
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
              "h-2",
              budgetUsage > 100 ? "[&>div]:bg-destructive" : budgetUsage > 90 ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
            )}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">Spent: ${totalCost.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground">Budget: ${weeklyBudget.toLocaleString()}</span>
          </div>
        </FormSection>

        {/* Charts */}
        <FormSection title="Shift Status Distribution">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </FormSection>

        <FormSection title="Hours by Role">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="role" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
