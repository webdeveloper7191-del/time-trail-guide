import { Badge } from '@/components/ui/badge';
import { Shift, OpenShift, StaffMember } from '@/types/roster';
import { useMemo } from 'react';

interface SummaryItem {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

interface RosterSummaryBarProps {
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  centreId: string;
}

export function RosterSummaryBar({ shifts, openShifts, staff, dates, centreId }: RosterSummaryBarProps) {
  const summary = useMemo(() => {
    const centreShifts = shifts.filter(s => s.centreId === centreId);
    const centreOpenShifts = openShifts.filter(os => os.centreId === centreId);
    
    // Count shifts by status
    const empty = dates.length * staff.length - centreShifts.length;
    const unpublished = centreShifts.filter(s => s.status === 'draft').length;
    const published = centreShifts.filter(s => s.status === 'published').length;
    const confirmed = centreShifts.filter(s => s.status === 'confirmed').length;
    const completed = centreShifts.filter(s => s.status === 'completed').length;
    
    // Open shifts
    const openShiftCount = centreOpenShifts.length;
    
    // Warnings (shifts with compliance issues - simplified)
    const warnings = centreShifts.filter(s => {
      const member = staff.find(m => m.id === s.staffId);
      return member && member.currentWeeklyHours >= member.maxHoursPerWeek;
    }).length;
    
    // Leave data
    const leaveApproved = staff.filter(s => 
      s.timeOff?.some(to => to.status === 'approved')
    ).length;
    const leavePending = staff.filter(s => 
      s.timeOff?.some(to => to.status === 'pending')
    ).length;
    
    // Unavailable (on time off for current dates)
    const unavailable = staff.filter(s => 
      s.timeOff?.some(to => to.status === 'approved')
    ).length;

    return {
      empty: Math.max(0, empty),
      unpublished,
      published,
      confirmed,
      completed,
      openShift: openShiftCount,
      warnings,
      leaveApproved,
      leavePending,
      unavailable,
    };
  }, [shifts, openShifts, staff, dates, centreId]);

  const items: SummaryItem[] = [
    { label: 'Empty', count: summary.empty, color: 'bg-background', bgColor: 'border border-border' },
    { label: 'Unpublished', count: summary.unpublished, color: 'bg-amber-500', bgColor: 'bg-amber-500/20' },
    { label: 'Published', count: summary.published, color: 'bg-emerald-500', bgColor: 'bg-emerald-500/20' },
    { label: 'Confirmed', count: summary.confirmed, color: 'bg-blue-500', bgColor: 'bg-blue-500/20' },
    { label: 'Open Shift', count: summary.openShift, color: 'bg-primary', bgColor: 'bg-primary/20' },
    { label: 'Warnings', count: summary.warnings, color: 'bg-red-500', bgColor: 'bg-red-500/20' },
    { label: 'Leave Approved', count: summary.leaveApproved, color: 'bg-emerald-600', bgColor: 'bg-emerald-600/20' },
    { label: 'Leave Pending', count: summary.leavePending, color: 'bg-amber-600', bgColor: 'bg-amber-600/20' },
    { label: 'People Unavailable', count: summary.unavailable, color: 'bg-muted-foreground', bgColor: 'bg-muted' },
  ];

  // Items to show on mobile (condensed)
  const mobileItems = items.filter(item => 
    ['Unpublished', 'Published', 'Open Shift', 'Warnings'].includes(item.label) && item.count > 0
  );

  return (
    <>
      {/* Desktop Summary Bar */}
      <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-card border-t border-border overflow-x-auto">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <div className={`h-3 w-3 rounded-sm ${item.color} ${item.bgColor}`} />
            <span className="text-muted-foreground">{item.count}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
        
        {/* Divider */}
        <div className="h-4 w-px bg-border mx-2" />
        
        {/* Holiday & Event indicators */}
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className="h-3 w-3 rounded-sm bg-destructive" />
          <span className="text-muted-foreground">Public Holiday</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className="h-3 w-3 rounded-sm bg-amber-500" />
          <span className="text-muted-foreground">School Holiday</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span className="text-muted-foreground">Event</span>
        </div>
      </div>

      {/* Mobile Summary Bar - Condensed */}
      <div className="md:hidden flex items-center gap-3 px-3 py-2 bg-card border-t border-border overflow-x-auto">
        {mobileItems.length > 0 ? (
          mobileItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1 text-[10px] whitespace-nowrap">
              <div className={`h-2.5 w-2.5 rounded-sm ${item.color} ${item.bgColor}`} />
              <span className="text-muted-foreground font-medium">{item.count}</span>
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))
        ) : (
          <div className="text-[10px] text-muted-foreground">No shifts scheduled</div>
        )}
        
        {/* Condensed legend for mobile */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px]">
            <div className="h-2 w-2 rounded-sm bg-destructive" />
            <span className="text-muted-foreground">Holiday</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <div className="h-2 w-2 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Event</span>
          </div>
        </div>
      </div>
    </>
  );
}
