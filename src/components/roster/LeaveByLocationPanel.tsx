import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Flag, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Centre, StaffMember, TimeOff, timeOffTypeLabels } from '@/types/roster';
import { mockPublicHolidays, PublicHoliday } from '@/data/mockHolidaysEvents';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaveByLocationPanelProps {
  open: boolean;
  onClose: () => void;
  centres: Centre[];
  staff: StaffMember[];
  currentDate: Date;
}

type ViewTab = 'leaves' | 'holidays';

export function LeaveByLocationPanel({
  open,
  onClose,
  centres,
  staff,
  currentDate,
}: LeaveByLocationPanelProps) {
  const [selectedCentreId, setSelectedCentreId] = useState<string>('all');
  const [viewDate, setViewDate] = useState(currentDate);
  const [activeTab, setActiveTab] = useState<ViewTab>('leaves');

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);

  // Get staff grouped by location
  const staffByLocation = useMemo(() => {
    const map: Record<string, StaffMember[]> = {};
    centres.forEach(c => { map[c.id] = []; });
    staff.forEach(s => {
      const centreId = s.defaultCentreId || s.preferredCentres?.[0] || centres[0]?.id;
      if (centreId && map[centreId]) {
        map[centreId].push(s);
      } else if (centres[0]) {
        map[centres[0].id]?.push(s);
      }
    });
    return map;
  }, [staff, centres]);

  // Get leaves for the selected month, filtered by location
  const leavesByLocation = useMemo(() => {
    const result: Record<string, { staff: StaffMember; leave: TimeOff }[]> = {};
    centres.forEach(c => { result[c.id] = []; });

    const startStr = format(monthStart, 'yyyy-MM-dd');
    const endStr = format(monthEnd, 'yyyy-MM-dd');

    staff.forEach(s => {
      const centreId = s.defaultCentreId || s.preferredCentres?.[0] || centres[0]?.id;
      if (!centreId) return;

      s.timeOff?.forEach(to => {
        if (to.endDate >= startStr && to.startDate <= endStr) {
          if (result[centreId]) {
            result[centreId].push({ staff: s, leave: to });
          }
        }
      });
    });

    return result;
  }, [staff, centres, monthStart, monthEnd]);

  // Get public holidays for the month
  const monthHolidays = useMemo(() => {
    const startStr = format(monthStart, 'yyyy-MM-dd');
    const endStr = format(monthEnd, 'yyyy-MM-dd');
    return mockPublicHolidays.filter(h => h.date >= startStr && h.date <= endStr && h.type === 'public_holiday');
  }, [monthStart, monthEnd]);

  const filteredCentres = selectedCentreId === 'all' ? centres : centres.filter(c => c.id === selectedCentreId);

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalLeaves = filteredCentres.reduce((sum, c) => sum + (leavesByLocation[c.id]?.length || 0), 0);

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Leaves & Holidays by Location"
      description={`${format(viewDate, 'MMMM yyyy')} · ${filteredCentres.length} location${filteredCentres.length !== 1 ? 's' : ''}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-3">
          <Select value={selectedCentreId} onValueChange={setSelectedCentreId}>
            <SelectTrigger className="flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <SelectValue placeholder="Select location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {centres.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(subMonths(viewDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">{format(viewDate, 'MMM yyyy')}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(addMonths(viewDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('leaves')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-colors',
              activeTab === 'leaves' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Leaves ({totalLeaves})
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-colors',
              activeTab === 'holidays' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Flag className="h-3.5 w-3.5" />
            Public Holidays ({monthHolidays.length})
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          {activeTab === 'leaves' ? (
            <div className="space-y-4">
              {filteredCentres.map(centre => {
                const centreLeaves = leavesByLocation[centre.id] || [];
                const centreStaff = staffByLocation[centre.id] || [];

                return (
                  <FormSection key={centre.id} title={centre.name}>
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{centreStaff.length} staff · {centreLeaves.length} leave request{centreLeaves.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {centreLeaves.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3 text-center">No leave requests this month</p>
                    ) : (
                      <div className="space-y-2">
                        {centreLeaves.map(({ staff: member, leave }, idx) => (
                          <div key={`${member.id}-${leave.id}-${idx}`} className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-card">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: member.color + '22', color: member.color }}
                            >
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{member.name}</span>
                                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getLeaveStatusColor(leave.status))}>
                                  {leave.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {timeOffTypeLabels[leave.type]} · {format(new Date(leave.startDate), 'MMM d')} – {format(new Date(leave.endDate), 'MMM d')}
                              </div>
                              {(leave as any).reason && (
                                <p className="text-xs text-muted-foreground mt-1 italic">"{(leave as any).reason}"</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormSection>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* National holidays */}
              <FormSection title="National Holidays">
                {monthHolidays.filter(h => !h.state).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">No national holidays this month</p>
                ) : (
                  <div className="space-y-2">
                    {monthHolidays.filter(h => !h.state).map(holiday => (
                      <HolidayRow key={holiday.id} holiday={holiday} affectedCentres={filteredCentres} />
                    ))}
                  </div>
                )}
              </FormSection>

              {/* State-specific holidays */}
              {monthHolidays.filter(h => h.state).length > 0 && (
                <FormSection title="State/Regional Holidays" defaultOpen>
                  <div className="space-y-2">
                    {monthHolidays.filter(h => h.state).map(holiday => (
                      <HolidayRow key={holiday.id} holiday={holiday} affectedCentres={filteredCentres} />
                    ))}
                  </div>
                </FormSection>
              )}

              {/* Per-location impact summary */}
              <FormSection title="Location Impact Summary" defaultOpen>
                <div className="space-y-2">
                  {filteredCentres.map(centre => {
                    const centreStaff = staffByLocation[centre.id] || [];
                    // All national + state holidays apply
                    const applicableHolidays = monthHolidays.filter(h => !h.state || h.state === 'VIC');

                    return (
                      <div key={centre.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-medium">{centre.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{centreStaff.length} staff</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {applicableHolidays.length} holiday{applicableHolidays.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormSection>
            </div>
          )}
        </ScrollArea>
      </div>
    </PrimaryOffCanvas>
  );
}

function HolidayRow({ holiday, affectedCentres }: { holiday: PublicHoliday; affectedCentres: Centre[] }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <Flag className="h-3.5 w-3.5 text-red-600" />
        </div>
        <div>
          <span className="text-sm font-medium">{holiday.name}</span>
          <div className="text-xs text-muted-foreground">
            {format(new Date(holiday.date), 'EEEE, d MMMM yyyy')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {holiday.state && (
          <Badge variant="outline" className="text-[10px]">{holiday.state}</Badge>
        )}
        <Badge variant="secondary" className="text-[10px]">
          {affectedCentres.length} location{affectedCentres.length !== 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );
}
