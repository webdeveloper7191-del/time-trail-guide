import { StaffMember, Shift, roleLabels, qualificationLabels } from '@/types/roster';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Award, 
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useState } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StaffProfileModalProps {
  staff: StaffMember | null;
  shifts: Shift[];
  isOpen: boolean;
  onClose: () => void;
}

export function StaffProfileModal({ staff, shifts, isOpen, onClose }: StaffProfileModalProps) {
  const [tabValue, setTabValue] = useState('contact');
  
  if (!staff) return null;

  const staffShifts = shifts.filter(s => s.staffId === staff.id);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const thisWeekShifts = staffShifts.filter(s => {
    const shiftDate = parseISO(s.date);
    return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
  });

  let weeklyHours = 0;
  thisWeekShifts.forEach(shift => {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    weeklyHours += ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
  });

  const hoursProgress = (weeklyHours / staff.maxHoursPerWeek) * 100;
  const totalEarnings = weeklyHours * staff.hourlyRate;

  const upcomingShifts = staffShifts
    .filter(s => parseISO(s.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <PrimaryOffCanvas
      open={isOpen}
      onClose={onClose}
      title={staff.name}
      description={roleLabels[staff.role]}
      icon={User}
      size="md"
      showFooter={false}
    >
      <div className="space-y-4">
        {/* Staff Header Card */}
        <div className="rounded-lg bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold border-2 border-white/30">
              {staff.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{staff.name}</h3>
              <p className="text-sm opacity-90">{roleLabels[staff.role]}</p>
              <Badge variant={staff.agency ? "destructive" : "secondary"} className="mt-1">
                {staff.agency ? 'Agency' : 'Permanent'}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold">${staff.hourlyRate}</span>
              <span className="text-xs opacity-80 block">/hour</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30">
          <div className="p-3 text-center border-r border-border">
            <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
              <Clock size={12} />
              <span className="text-xs">This Week</span>
            </div>
            <p className="text-base font-bold text-primary">{weeklyHours.toFixed(1)}h</p>
          </div>
          <div className="p-3 text-center border-r border-border">
            <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
              <DollarSign size={12} />
              <span className="text-xs">Earnings</span>
            </div>
            <p className="text-base font-bold text-success">${totalEarnings.toFixed(0)}</p>
          </div>
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
              <Calendar size={12} />
              <span className="text-xs">Shifts</span>
            </div>
            <p className="text-base font-bold">{thisWeekShifts.length}</p>
          </div>
        </div>

        {/* Hours Progress */}
        <FormSection title="Weekly Hours Progress">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className={cn(
              "text-xs font-semibold",
              hoursProgress > 100 ? "text-destructive" : "text-primary"
            )}>
              {hoursProgress.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={Math.min(hoursProgress, 100)} 
            className={cn(
              "h-2",
              hoursProgress > 100 ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {weeklyHours.toFixed(1)} / {staff.maxHoursPerWeek} max hours
          </p>
        </FormSection>

        {/* Tabs */}
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="contact" className="text-xs">
              <Mail size={14} className="mr-1" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs">
              <Calendar size={14} className="mr-1" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="quals" className="text-xs">
              <Award size={14} className="mr-1" />
              Quals
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4 space-y-3">
            <FormSection title="Contact Details">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{staff.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Phone size={16} className="text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{staff.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </FormSection>
            
            <FormSection title="Pay Information">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Standard</p>
                  <p className="text-sm font-semibold text-primary">${staff.hourlyRate}/hr</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overtime</p>
                  <p className="text-sm font-semibold text-warning">${staff.overtimeRate}/hr</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Hours</p>
                  <p className="text-sm font-semibold">{staff.maxHoursPerWeek}h</p>
                </div>
              </div>
            </FormSection>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-4">
            <FormSection title="Upcoming Shifts">
              {upcomingShifts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No upcoming shifts scheduled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingShifts.map(shift => (
                    <div 
                      key={shift.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="min-w-[50px] text-center p-2 rounded-lg bg-primary/10">
                        <span className="text-[10px] font-semibold text-primary block">
                          {format(parseISO(shift.date), 'MMM')}
                        </span>
                        <span className="text-lg font-bold text-primary leading-none">
                          {format(parseISO(shift.date), 'd')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{format(parseISO(shift.date), 'EEEE')}</p>
                        <p className="text-xs text-muted-foreground">{shift.startTime} - {shift.endTime}</p>
                      </div>
                      <Badge variant={shift.status === 'published' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                        {shift.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          </TabsContent>

          {/* Qualifications Tab */}
          <TabsContent value="quals" className="mt-4">
            <FormSection title="Qualifications">
              {staff.qualifications.length === 0 ? (
                <div className="text-center py-8">
                  <Award size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No qualifications recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staff.qualifications.map((qual, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        qual.isExpired ? "border-destructive bg-destructive/5" : 
                        qual.isExpiringSoon ? "border-warning bg-warning/5" : 
                        "border-border"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        qual.isExpired ? "bg-destructive/10" : 
                        qual.isExpiringSoon ? "bg-warning/10" : 
                        "bg-success/10"
                      )}>
                        {qual.isExpired ? (
                          <AlertCircle size={18} className="text-destructive" />
                        ) : qual.isExpiringSoon ? (
                          <AlertCircle size={18} className="text-warning" />
                        ) : (
                          <CheckCircle2 size={18} className="text-success" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{qualificationLabels[qual.type]}</p>
                        {qual.expiryDate && (
                          <p className="text-xs text-muted-foreground">Expires: {qual.expiryDate}</p>
                        )}
                      </div>
                      <Badge 
                        variant={qual.isExpired ? "destructive" : qual.isExpiringSoon ? "outline" : "secondary"}
                        className={cn(
                          "text-[10px]",
                          qual.isExpiringSoon && !qual.isExpired && "border-warning text-warning"
                        )}
                      >
                        {qual.isExpired ? 'Expired' : qual.isExpiringSoon ? 'Expiring' : 'Valid'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          </TabsContent>
        </Tabs>
      </div>
    </PrimaryOffCanvas>
  );
            }
