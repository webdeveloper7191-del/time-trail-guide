import { StaffMember, Shift, Centre, roleLabels } from '@/types/roster';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

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
  // Calculate summary stats
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

  // Shift status breakdown
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

  // Hours by role
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

  // Staff utilization
  const staffUtilization = staff.slice(0, 6).map(member => {
    const hours = staffHours[member.id] || 0;
    const utilization = (hours / member.maxHoursPerWeek) * 100;
    return {
      name: member.name.split(' ')[0],
      hours,
      max: member.maxHoursPerWeek,
      utilization: Math.min(utilization, 100),
    };
  });

  // Active staff count
  const activeStaffCount = Object.keys(staffHours).length;
  const totalStaffCount = staff.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Weekly Summary - {centre.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Hours</p>
                    <p className="text-xl font-bold">{totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                    <p className="text-xl font-bold">${totalCost.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Staff Rostered</p>
                    <p className="text-xl font-bold">{activeStaffCount}/{totalStaffCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Shifts</p>
                    <p className="text-xl font-bold">{centreShifts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Budget Usage</span>
                <span className={budgetUsage > 100 ? 'text-destructive' : budgetUsage > 90 ? 'text-amber-600' : 'text-emerald-600'}>
                  {budgetUsage.toFixed(1)}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={Math.min(budgetUsage, 100)} 
                className={`h-3 ${budgetUsage > 100 ? '[&>div]:bg-destructive' : budgetUsage > 90 ? '[&>div]:bg-amber-500' : ''}`}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Spent: ${totalCost.toFixed(0)}</span>
                <span>Budget: ${weeklyBudget.toLocaleString()}</span>
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs">Regular: ${regularCost.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs">Overtime: ${overtimeCost.toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Shift Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Shift Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hours by Role */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hours by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleData} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="role" type="category" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Utilization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffUtilization.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20 truncate">{item.name}</span>
                    <div className="flex-1">
                      <Progress 
                        value={item.utilization} 
                        className={`h-2 ${item.utilization > 100 ? '[&>div]:bg-destructive' : item.utilization > 80 ? '[&>div]:bg-amber-500' : ''}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {item.hours.toFixed(1)}h / {item.max}h
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Confirmed Shifts</p>
                <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{statusCounts.confirmed + statusCounts.published}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Draft Shifts</p>
                <p className="text-lg font-bold text-amber-800 dark:text-amber-300">{statusCounts.draft}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Avg Hours/Staff</p>
                <p className="text-lg font-bold text-purple-800 dark:text-purple-300">
                  {activeStaffCount > 0 ? (totalHours / activeStaffCount).toFixed(1) : 0}h
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
