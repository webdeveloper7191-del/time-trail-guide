import { Badge } from '@/components/ui/badge';
import { Shift, OpenShift, StaffMember } from '@/types/roster';
import { useMemo, useState } from 'react';
import { 
  Bot, 
  RefreshCw, 
  Phone, 
  Moon, 
  Clock, 
  PhoneCall, 
  AlertCircle, 
  UserX, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [showFullLegend, setShowFullLegend] = useState(false);
  
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
  
  // Items to show on tablet (medium condensed)
  const tabletItems = items.filter(item => 
    ['Empty', 'Unpublished', 'Published', 'Open Shift', 'Warnings', 'Leave Approved', 'Leave Pending'].includes(item.label)
  );

  // Full legend items organized by category
  const legendCategories = [
    {
      title: 'Shift Status',
      items: [
        { icon: <div className="h-3 w-3 rounded-sm bg-amber-500" />, label: 'Draft/Unpublished', description: 'Not yet published to staff' },
        { icon: <div className="h-3 w-3 rounded-sm bg-sky-500" />, label: 'Published', description: 'Visible to staff' },
        { icon: <div className="h-3 w-3 rounded-sm bg-emerald-500" />, label: 'Confirmed', description: 'Acknowledged by staff' },
        { icon: <div className="h-3 w-3 rounded-sm bg-slate-400" />, label: 'Completed', description: 'Past shift' },
      ],
    },
    {
      title: 'Shift Types',
      items: [
        { icon: <Clock className="h-3.5 w-3.5 text-muted-foreground" />, label: 'Regular', description: 'Standard shift' },
        { icon: <Phone className="h-3.5 w-3.5 text-blue-500" />, label: 'On-Call', description: 'Available if needed' },
        { icon: <Moon className="h-3.5 w-3.5 text-purple-500" />, label: 'Sleepover', description: 'Overnight stay shift' },
        { icon: <Zap className="h-3.5 w-3.5 text-orange-500" />, label: 'Split/Broken', description: 'Non-continuous shift' },
        { icon: <PhoneCall className="h-3.5 w-3.5 text-red-500" />, label: 'Recall', description: 'Called back to work' },
        { icon: <AlertCircle className="h-3.5 w-3.5 text-destructive" />, label: 'Emergency', description: 'Urgent coverage needed' },
      ],
    },
    {
      title: 'Special Indicators',
      items: [
        { icon: <Bot className="h-3.5 w-3.5 text-purple-500" />, label: 'AI Generated', description: 'Auto-assigned by solver' },
        { icon: <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />, label: 'Recurring', description: 'Part of a series' },
        { icon: <UserX className="h-3.5 w-3.5 text-destructive" />, label: 'Absent', description: 'Staff marked absent' },
        { icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />, label: 'Warning', description: 'Compliance issue detected' },
      ],
    },
    {
      title: 'Open Shift Urgency',
      items: [
        { icon: <div className="h-3 w-3 rounded-sm border border-muted-foreground/30 bg-muted/30" />, label: 'Low', description: 'Plenty of time to fill' },
        { icon: <div className="h-3 w-3 rounded-sm border border-amber-500/50 bg-amber-500/10" />, label: 'Medium', description: 'Should be filled soon' },
        { icon: <div className="h-3 w-3 rounded-sm border border-orange-500/50 bg-orange-500/10" />, label: 'High', description: 'Needs attention' },
        { icon: <div className="h-3 w-3 rounded-sm border border-destructive/50 bg-destructive/10" />, label: 'Critical', description: 'Immediate action required' },
      ],
    },
    {
      title: 'Calendar Events',
      items: [
        { icon: <div className="h-3 w-3 rounded-sm bg-destructive" />, label: 'Public Holiday', description: 'Government holiday' },
        { icon: <div className="h-3 w-3 rounded-sm bg-amber-500" />, label: 'School Holiday', description: 'School break period' },
        { icon: <div className="h-3 w-3 rounded-sm bg-primary" />, label: 'Centre Event', description: 'Special occasion' },
      ],
    },
    {
      title: 'Staff & Leave',
      items: [
        { icon: <div className="h-3 w-3 rounded-sm bg-emerald-600" />, label: 'Leave Approved', description: 'Time off confirmed' },
        { icon: <div className="h-3 w-3 rounded-sm bg-amber-600" />, label: 'Leave Pending', description: 'Awaiting approval' },
        { icon: <div className="h-3 w-3 rounded-sm bg-muted-foreground" />, label: 'Unavailable', description: 'Not available to work' },
        { icon: <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-amber-500 text-amber-600">OT</Badge>, label: 'Overtime', description: 'Extra pay rate applies' },
      ],
    },
  ];

  return (
    <>
      {/* Desktop Summary Bar - Full */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-card border-t border-border overflow-x-hidden w-full">
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
        
        {/* Full Legend Toggle */}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => setShowFullLegend(!showFullLegend)}
          >
            <Info className="h-3 w-3" />
            Full Legend
            {showFullLegend ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Tablet Summary Bar - Medium */}
      <div className="hidden md:flex lg:hidden items-center gap-3 px-4 py-2 bg-card border-t border-border overflow-x-auto w-full">
        {tabletItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <div className={`h-2.5 w-2.5 rounded-sm ${item.color} ${item.bgColor}`} />
            <span className="text-muted-foreground font-medium">{item.count}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
        
        <div className="h-3 w-px bg-border mx-1" />
        
        {/* Holiday indicators */}
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className="h-2.5 w-2.5 rounded-sm bg-destructive" />
          <span className="text-muted-foreground">Holiday</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span className="text-muted-foreground">Event</span>
        </div>
        
        {/* Full Legend Toggle */}
        <div className="ml-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => setShowFullLegend(!showFullLegend)}
          >
            <Info className="h-3 w-3" />
            Legend
            {showFullLegend ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Mobile Summary Bar - Condensed */}
      <div className="md:hidden flex items-center gap-3 px-3 py-2 bg-card border-t border-border overflow-x-auto w-full">
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
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-2 gap-1"
            onClick={() => setShowFullLegend(!showFullLegend)}
          >
            <Info className="h-2.5 w-2.5" />
            Legend
            {showFullLegend ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </Button>
        </div>
      </div>
      
      {/* Full Legend Panel - Collapsible */}
      <Collapsible open={showFullLegend} onOpenChange={setShowFullLegend}>
        <CollapsibleContent>
          <div className="bg-card border-t border-border px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {legendCategories.map((category) => (
                <div key={category.title} className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground">{category.title}</h4>
                  <div className="space-y-1.5">
                    {category.items.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="shrink-0 w-4 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-1 hidden sm:inline">
                            - {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
