import { StaffMember, Shift, roleLabels, qualificationLabels } from '@/types/roster';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Award, 
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Star
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

interface StaffProfileModalProps {
  staff: StaffMember | null;
  shifts: Shift[];
  isOpen: boolean;
  onClose: () => void;
}

export function StaffProfileModal({ staff, shifts, isOpen, onClose }: StaffProfileModalProps) {
  if (!staff) return null;

  const staffShifts = shifts.filter(s => s.staffId === staff.id);
  
  // Calculate weekly hours
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

  // Upcoming shifts (next 7 days)
  const upcomingShifts = staffShifts
    .filter(s => parseISO(s.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback 
                className="text-lg font-semibold text-white"
                style={{ backgroundColor: staff.color }}
              >
                {staff.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">{staff.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{roleLabels[staff.role]}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={staff.agency ? 'destructive' : 'secondary'}>
                  {staff.agency ? 'Agency' : 'Permanent'}
                </Badge>
                {staff.employmentType && (
                  <Badge variant="outline" className="capitalize">
                    {staff.employmentType}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">${staff.hourlyRate}/hr</div>
              <div className="text-xs text-muted-foreground">OT: ${staff.overtimeRate}/hr</div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-lg font-semibold">{weeklyHours.toFixed(1)}h / {staff.maxHoursPerWeek}h</p>
                    </div>
                  </div>
                  <Progress value={hoursProgress} className="mt-3 h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Earnings</p>
                      <p className="text-lg font-semibold">${totalEarnings.toFixed(2)}</p>
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
                      <p className="text-sm text-muted-foreground">Shifts This Week</p>
                      <p className="text-lg font-semibold">{thisWeekShifts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Shifts</p>
                      <p className="text-lg font-semibold">{staffShifts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Availability */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                    const isAvailable = staff.availability?.includes(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx] as any);
                    return (
                      <div 
                        key={day}
                        className={`flex-1 py-2 text-center rounded-md text-xs font-medium transition-colors ${
                          isAvailable 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.phone || 'Not provided'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingShifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No upcoming shifts</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingShifts.map(shift => (
                      <div 
                        key={shift.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {format(parseISO(shift.date), 'MMM')}
                            </span>
                            <span className="text-sm font-bold text-primary">
                              {format(parseISO(shift.date), 'd')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{format(parseISO(shift.date), 'EEEE')}</p>
                            <p className="text-xs text-muted-foreground">
                              {shift.startTime} - {shift.endTime}
                            </p>
                          </div>
                        </div>
                        <Badge variant={shift.status === 'published' ? 'default' : 'outline'} className="capitalize">
                          {shift.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qualifications" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Qualifications & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staff.qualifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No qualifications recorded</p>
                ) : (
                  <div className="space-y-3">
                    {staff.qualifications.map((qual, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          qual.isExpired 
                            ? 'bg-destructive/10 border-destructive/30' 
                            : qual.isExpiringSoon 
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                              : 'bg-muted/50 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            qual.isExpired 
                              ? 'bg-destructive/20' 
                              : qual.isExpiringSoon 
                                ? 'bg-amber-500/20' 
                                : 'bg-emerald-500/20'
                          }`}>
                            <Star className={`h-4 w-4 ${
                              qual.isExpired 
                                ? 'text-destructive' 
                                : qual.isExpiringSoon 
                                  ? 'text-amber-600' 
                                  : 'text-emerald-600'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{qualificationLabels[qual.type]}</p>
                            {qual.expiryDate && (
                              <p className="text-xs text-muted-foreground">
                                Expires: {qual.expiryDate}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={qual.isExpired ? 'destructive' : qual.isExpiringSoon ? 'outline' : 'secondary'}>
                          {qual.isExpired ? 'Expired' : qual.isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
