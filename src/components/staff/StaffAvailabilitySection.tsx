import { StaffMember } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Edit,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

interface StaffAvailabilitySectionProps {
  staff: StaffMember;
}

const dayLabels: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function StaffAvailabilitySection({ staff }: StaffAvailabilitySectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Time & Attendance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage availability and attendance settings
          </p>
        </div>
        <Button size="sm" className="bg-primary">
          <Edit className="h-4 w-4 mr-2" />
          Edit Availability
        </Button>
      </div>

      {/* Availability Pattern */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Weekly Availability Pattern
            </CardTitle>
            <Badge variant="secondary">
              {staff.availabilityPattern === 'same_every_week' ? 'Same Every Week' : 'Alternating Weeks'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {Object.entries(dayLabels).map(([key, label]) => {
              const availability = staff.weeklyAvailability.find(a => a.dayOfWeek === key);
              const isAvailable = availability?.isAvailable;
              
              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    isAvailable 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {label.slice(0, 3)}
                  </p>
                  {isAvailable ? (
                    <>
                      <Check className="h-5 w-5 mx-auto text-green-600 mb-1" />
                      <p className="text-xs font-medium">
                        {availability.startTime} - {availability.endTime}
                      </p>
                      {availability.breakMinutes && (
                        <p className="text-xs text-muted-foreground">
                          {availability.breakMinutes}min break
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Unavailable</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Hours Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Weekly Hours Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">
                {staff.weeklyAvailability.filter(a => a.isAvailable).length}
              </p>
              <p className="text-sm text-muted-foreground">Days Available</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">
                {staff.weeklyAvailability.reduce((total, day) => {
                  if (!day.isAvailable || !day.startTime || !day.endTime) return total;
                  const [startH, startM] = day.startTime.split(':').map(Number);
                  const [endH, endM] = day.endTime.split(':').map(Number);
                  const hours = (endH + endM/60) - (startH + startM/60);
                  return total + hours;
                }, 0).toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Gross Hours</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">
                {staff.weeklyAvailability.reduce((total, day) => {
                  if (!day.isAvailable || !day.startTime || !day.endTime) return total;
                  const [startH, startM] = day.startTime.split(':').map(Number);
                  const [endH, endM] = day.endTime.split(':').map(Number);
                  const hours = (endH + endM/60) - (startH + startM/60) - (day.breakMinutes || 0) / 60;
                  return total + hours;
                }, 0).toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Net Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracted Hours */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Contracted Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {staff.currentPayCondition?.contractedHours || 0}
              </p>
              <p className="text-sm text-muted-foreground">Hours/Week</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                This staff member is contracted for {staff.currentPayCondition?.contractedHours || 0} hours per week
                under their current {staff.currentPayCondition?.payPeriod} pay arrangement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Clock Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Time Clock Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Time Clock Passcode</p>
              <p className="text-lg font-mono font-medium">
                {staff.timeClockPasscode || 'Not Set'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Payroll ID</p>
              <p className="text-lg font-medium">
                {staff.payrollId || 'Not Set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qualifications */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Qualifications & Certifications</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Qualification
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staff.qualifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {staff.qualifications.map((qual, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {qual}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No qualifications added</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
