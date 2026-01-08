import { StaffMember, Shift, Centre, roleLabels } from '@/types/roster';
import {
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  Calendar,
  PieChart
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Weekly Summary - {centre.name}
          </SheetTitle>
          <SheetDescription>
            Overview of hours, costs, and staffing for the current period
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 mt-6 h-[calc(100vh-140px)]">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Key Metrics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              {[
                { icon: Clock, label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, color: 'primary' },
                { icon: DollarSign, label: 'Total Cost', value: `$${totalCost.toFixed(0)}`, color: 'success' },
                { icon: Users, label: 'Staff Rostered', value: `${activeStaffCount}/${totalStaffCount}`, color: 'secondary' },
                { icon: Calendar, label: 'Total Shifts', value: centreShifts.length, color: 'warning' },
              ].map((metric, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${metric.color}.light` }}>
                      <metric.icon size={20} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{metric.label}</Typography>
                      <Typography variant="h6" fontWeight={700}>{metric.value}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Budget Progress */}
            <Card variant="outlined">
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={500}>Budget Usage</Typography>
                    <Typography variant="body2" fontWeight={600} color={budgetUsage > 100 ? 'error.main' : budgetUsage > 90 ? 'warning.main' : 'success.main'}>
                      {budgetUsage.toFixed(1)}%
                    </Typography>
                  </Box>
                }
                sx={{ pb: 0 }}
              />
              <CardContent>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(budgetUsage, 100)} 
                  color={budgetUsage > 100 ? 'error' : budgetUsage > 90 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 1, mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Spent: ${totalCost.toFixed(0)}</Typography>
                  <Typography variant="caption" color="text.secondary">Budget: ${weeklyBudget.toLocaleString()}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <Card variant="outlined">
                <CardHeader title={<Typography variant="body2" fontWeight={500}>Shift Status Distribution</Typography>} />
                <CardContent>
                  <Box sx={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardHeader title={<Typography variant="body2" fontWeight={500}>Hours by Role</Typography>} />
                <CardContent>
                  <Box sx={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="role" type="category" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="hours" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
