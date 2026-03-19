import { Badge } from '@/components/ui/badge';
import { Shift, OpenShift, StaffMember, ShiftTemplate, defaultShiftTemplates } from '@/types/roster';
import { CallbackEvent } from './CallbackEventLoggingPanel';
import { SleepoverEvent, SplitShiftEvent } from '@/types/shiftEvents';
import { useMemo, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  ChevronDown,
  ChevronUp,
  Info,
  Palette,
  Clock,
  PhoneCall,
  DollarSign,
  Moon,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  shiftStatusColors,
  shiftTypeConfig,
  openShiftColors,
  calendarEventColors,
  leaveColors,
  specialIndicatorConfig,
} from '@/lib/rosterColors';

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
  callbackEvents?: CallbackEvent[];
  sleepoverEvents?: SleepoverEvent[];
  splitShiftEvents?: SplitShiftEvent[];
  shiftTemplates?: ShiftTemplate[];
}

export function RosterSummaryBar({ shifts, openShifts, staff, dates, centreId, callbackEvents = [], sleepoverEvents = [], splitShiftEvents = [], shiftTemplates = [] }: RosterSummaryBarProps) {
  const [showFullLegend, setShowFullLegend] = useState(false);
  const [showColorTokens, setShowColorTokens] = useState(false);
  const [legendMode, setLegendMode] = useState<'status' | 'templates'>('status');
  
  // Compute template usage stats
  const templateStats = useMemo(() => {
    const allTemplates = shiftTemplates.length > 0 ? shiftTemplates : defaultShiftTemplates;
    const centreShifts = shifts.filter(s => s.centreId === centreId);
    return allTemplates.map(t => ({
      ...t,
      count: centreShifts.filter(s => s.templateId === t.id).length,
    }));
  }, [shifts, centreId, shiftTemplates]);
  
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

  const callbackSummary = useMemo(() => {
    const totalEvents = callbackEvents.length;
    const totalCost = callbackEvents.reduce((sum, e) => sum + e.calculatedPay, 0);
    const pendingCount = callbackEvents.filter(e => e.status === 'logged').length;
    return { totalEvents, totalCost, pendingCount };
  }, [callbackEvents]);

  const sleepoverSummary = useMemo(() => {
    const totalEvents = sleepoverEvents.length;
    const totalCost = sleepoverEvents.reduce((sum, e) => sum + e.totalPay, 0);
    const pendingCount = sleepoverEvents.filter(e => e.status === 'logged').length;
    const otCount = sleepoverEvents.filter(e => e.overtimeTriggered).length;
    return { totalEvents, totalCost, pendingCount, otCount };
  }, [sleepoverEvents]);

  const splitShiftSummary = useMemo(() => {
    const totalEvents = splitShiftEvents.length;
    const totalCost = splitShiftEvents.reduce((sum, e) => sum + e.totalPay, 0);
    const pendingCount = splitShiftEvents.filter(e => e.status === 'logged').length;
    const nonCompliant = splitShiftEvents.filter(e => !e.gapCompliant).length;
    return { totalEvents, totalCost, pendingCount, nonCompliant };
  }, [splitShiftEvents]);

  const items: SummaryItem[] = [
    { label: 'Empty', count: summary.empty, color: 'bg-background', bgColor: 'border border-border' },
    { label: 'Unpublished', count: summary.unpublished, color: shiftStatusColors.draft.legendBg, bgColor: shiftStatusColors.draft.badgeBg },
    { label: 'Published', count: summary.published, color: shiftStatusColors.published.legendBg, bgColor: shiftStatusColors.published.bg },
    { label: 'Confirmed', count: summary.confirmed, color: shiftStatusColors.confirmed.legendBg, bgColor: shiftStatusColors.confirmed.badgeBg },
    { label: 'Open Shift', count: summary.openShift, color: openShiftColors.accent, bgColor: openShiftColors.bg },
    { label: 'Warnings', count: summary.warnings, color: specialIndicatorConfig.warning.bg, bgColor: specialIndicatorConfig.warning.bg },
    { label: 'Leave Approved', count: summary.leaveApproved, color: leaveColors.approved.dot, bgColor: 'bg-emerald-500/20' },
    { label: 'Leave Pending', count: summary.leavePending, color: leaveColors.pending.dot, bgColor: 'bg-amber-500/20' },
    { label: 'People Unavailable', count: summary.unavailable, color: leaveColors.unavailable.bg, bgColor: leaveColors.unavailable.bg },
  ];

  // Items to show on mobile (condensed)
  const mobileItems = items.filter(item => 
    ['Unpublished', 'Published', 'Open Shift', 'Warnings'].includes(item.label) && item.count > 0
  );
  
  // Items to show on tablet (medium condensed)
  const tabletItems = items.filter(item => 
    ['Empty', 'Unpublished', 'Published', 'Open Shift', 'Warnings', 'Leave Approved', 'Leave Pending'].includes(item.label)
  );

  // Full legend items organized by category - dynamically built from rosterColors
  const legendCategories = [
    {
      title: 'Shift Status',
      items: Object.entries(shiftStatusColors).map(([key, value]) => ({
        icon: (
          <div 
            className={cn(
              "h-3 w-6 rounded-sm border",
              value.bg,
              value.border,
              key === 'draft' && 'border-dashed border-2'
            )} 
          />
        ),
        label: value.legendLabel,
        description: value.legendDescription,
      })),
    },
    {
      title: 'Shift Types',
      items: Object.entries(shiftTypeConfig).map(([key, config]) => {
        const Icon = config.icon;
        return {
          icon: <Icon className={cn("h-3.5 w-3.5", config.color)} />,
          label: config.label,
          description: config.description,
        };
      }),
    },
    {
      title: 'Special Indicators',
      items: [
        ...Object.entries(specialIndicatorConfig).map(([key, config]) => {
          const Icon = config.icon;
          return {
            icon: (
              <div className={cn("p-0.5 rounded", config.bg)}>
                <Icon className={cn("h-3 w-3", config.iconColor)} />
              </div>
            ),
            label: config.label,
            description: config.description,
          };
        }),
        { 
          icon: <div className="flex items-center gap-0.5 text-slate-500"><Clock className="h-3 w-3" /><span className="text-[9px]">9-5</span></div>, 
          label: 'Availability Times', 
          description: 'Staff working hours shown' 
        },
      ],
    },
    {
      title: 'Open Shifts',
      items: [
        {
          icon: (
            <div className={cn(
              "h-3 w-6 rounded border",
              openShiftColors.bgGradient,
              openShiftColors.border
            )} />
          ),
          label: openShiftColors.legendLabel,
          description: openShiftColors.legendDescription,
        },
      ],
    },
    {
      title: 'Calendar Events',
      items: Object.entries(calendarEventColors).map(([key, value]) => ({
        icon: <div className={cn("h-3 w-3 rounded-sm", value.bg)} />,
        label: value.label,
        description: value.description,
      })),
    },
    {
      title: 'Staff & Leave',
      items: [
        { icon: <div className={cn("h-3 w-3 rounded-full", leaveColors.approved.dot)} />, label: leaveColors.approved.label, description: leaveColors.approved.description },
        { icon: <div className={cn("h-3 w-3 rounded-full", leaveColors.pending.dot)} />, label: leaveColors.pending.label, description: leaveColors.pending.description },
        { icon: <div className={cn("h-3 w-6 rounded-sm", leaveColors.unavailable.bg)} style={{ backgroundImage: leaveColors.unavailable.pattern }} />, label: leaveColors.unavailable.label, description: leaveColors.unavailable.description },
        { icon: <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-500/10">OT</Badge>, label: 'Overtime', description: 'Extra pay rate applies' },
        { icon: <div className="flex gap-0.5"><Badge variant="secondary" className="text-[7px] px-1 py-0 h-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">M</Badge><Badge variant="secondary" className="text-[7px] px-1 py-0 h-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">T</Badge><Badge variant="secondary" className="text-[7px] px-1 py-0 h-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">W</Badge></div>, label: 'Availability Days', description: 'Staff available work days' },
      ],
    },
  ];

  // Color Token Preview Categories
  const colorTokenCategories = [
    {
      title: 'Shift Status Tokens',
      tokens: Object.entries(shiftStatusColors).map(([key, value]) => ({
        name: key,
        swatches: [
          { label: 'bg', class: value.bg },
          { label: 'border', class: value.border },
          { label: 'accent', class: value.accent },
          { label: 'text', class: value.text },
        ],
      })),
    },
    {
      title: 'Shift Type Tokens',
      tokens: Object.entries(shiftTypeConfig).map(([key, value]) => ({
        name: key,
        swatches: [
          { label: 'color', class: value.color.replace('text-', 'bg-') },
          { label: 'bgColor', class: value.bgColor },
        ],
      })),
    },
    {
      title: 'Open Shift Tokens',
      tokens: [{
        name: 'openShift',
        swatches: [
          { label: 'bg', class: openShiftColors.bg },
          { label: 'gradient', class: openShiftColors.bgGradient },
          { label: 'border', class: openShiftColors.border },
          { label: 'accent', class: openShiftColors.accent },
        ],
      }],
    },
    {
      title: 'Calendar Event Tokens',
      tokens: Object.entries(calendarEventColors).map(([key, value]) => ({
        name: key,
        swatches: [
          { label: 'bg', class: value.bg },
        ],
      })),
    },
    {
      title: 'Leave Tokens',
      tokens: Object.entries(leaveColors).map(([key, value]) => ({
        name: key,
        swatches: 'dot' in value 
          ? [{ label: 'dot', class: value.dot }]
          : [{ label: 'bg', class: value.bg }],
      })),
    },
    {
      title: 'Special Indicator Tokens',
      tokens: Object.entries(specialIndicatorConfig).map(([key, value]) => ({
        name: key,
        swatches: [
          { label: 'bg', class: value.bg },
          { label: 'icon', class: value.iconColor.replace('text-', 'bg-') },
        ],
      })),
    },
  ];

  return (
    <>
      {/* Desktop Summary Bar - Full */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-card border-t border-border overflow-x-hidden w-full">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <div className={cn("h-3 w-3 rounded-sm", item.color, item.bgColor)} />
            <span className="text-muted-foreground">{item.count}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
        
        {/* Callback cost summary */}
        {callbackSummary.totalEvents > 0 && (
          <>
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <PhoneCall className="h-3 w-3 text-amber-600" />
              <span className="text-muted-foreground font-medium">{callbackSummary.totalEvents}</span>
              <span className="text-muted-foreground">Callbacks</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <DollarSign className="h-3 w-3 text-emerald-600" />
              <span className="font-semibold text-foreground">${callbackSummary.totalCost.toFixed(0)}</span>
              <span className="text-muted-foreground">spend</span>
            </div>
            {callbackSummary.pendingCount > 0 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-500/10">
                {callbackSummary.pendingCount} pending
              </Badge>
            )}
          </>
        )}

        {/* Sleepover cost summary */}
        {sleepoverSummary.totalEvents > 0 && (
          <>
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <Moon className="h-3 w-3 text-purple-600" />
              <span className="text-muted-foreground font-medium">{sleepoverSummary.totalEvents}</span>
              <span className="text-muted-foreground">Sleepovers</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <DollarSign className="h-3 w-3 text-emerald-600" />
              <span className="font-semibold text-foreground">${sleepoverSummary.totalCost.toFixed(0)}</span>
            </div>
            {sleepoverSummary.pendingCount > 0 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-500/10">
                {sleepoverSummary.pendingCount} pending
              </Badge>
            )}
          </>
        )}

        {/* Split shift cost summary */}
        {splitShiftSummary.totalEvents > 0 && (
          <>
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <Zap className="h-3 w-3 text-orange-600" />
              <span className="text-muted-foreground font-medium">{splitShiftSummary.totalEvents}</span>
              <span className="text-muted-foreground">Split Shifts</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <DollarSign className="h-3 w-3 text-emerald-600" />
              <span className="font-semibold text-foreground">${splitShiftSummary.totalCost.toFixed(0)}</span>
            </div>
            {splitShiftSummary.pendingCount > 0 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-500/10">
                {splitShiftSummary.pendingCount} pending
              </Badge>
            )}
          </>
        )}

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-2" />
        
        {/* Holiday & Event indicators from central system */}
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className={cn("h-3 w-3 rounded-sm", calendarEventColors.publicHoliday.bg)} />
          <span className="text-muted-foreground">{calendarEventColors.publicHoliday.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className={cn("h-3 w-3 rounded-sm", calendarEventColors.schoolHoliday.bg)} />
          <span className="text-muted-foreground">{calendarEventColors.schoolHoliday.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className={cn("h-3 w-3 rounded-sm", calendarEventColors.centreEvent.bg)} />
          <span className="text-muted-foreground">{calendarEventColors.centreEvent.label}</span>
        </div>
        
        {/* Full Legend Toggle */}
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => setShowColorTokens(!showColorTokens)}
          >
            <Palette className="h-3 w-3" />
            Tokens
            {showColorTokens ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
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

      {/* Tablet Summary Bar - Medium */}
      <div className="hidden md:flex lg:hidden items-center gap-3 px-4 py-2 bg-card border-t border-border overflow-x-auto w-full">
        {tabletItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <div className={cn("h-2.5 w-2.5 rounded-sm", item.color, item.bgColor)} />
            <span className="text-muted-foreground font-medium">{item.count}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
        
        <div className="h-3 w-px bg-border mx-1" />
        
        {/* Holiday indicators */}
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className={cn("h-2.5 w-2.5 rounded-sm", calendarEventColors.publicHoliday.bg)} />
          <span className="text-muted-foreground">Holiday</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <div className={cn("h-2.5 w-2.5 rounded-sm", calendarEventColors.centreEvent.bg)} />
          <span className="text-muted-foreground">Event</span>
        </div>
        
        {/* Full Legend Toggle */}
        <div className="ml-auto shrink-0 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => setShowColorTokens(!showColorTokens)}
          >
            <Palette className="h-3 w-3" />
          </Button>
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
              <div className={cn("h-2.5 w-2.5 rounded-sm", item.color, item.bgColor)} />
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
      
      {/* Color Token Preview Panel - Collapsible */}
      <Collapsible open={showColorTokens} onOpenChange={setShowColorTokens}>
        <CollapsibleContent>
          <div className="bg-muted/30 border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Color Token Preview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {colorTokenCategories.map((category) => (
                <div key={category.title} className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{category.title}</h4>
                  <div className="space-y-1.5">
                    {category.tokens.map((token) => (
                      <div key={token.name} className="flex items-center gap-2">
                        <code className="text-[10px] text-foreground bg-muted px-1 py-0.5 rounded font-mono min-w-[60px]">
                          {token.name.charAt(0).toUpperCase() + token.name.slice(1).replace(/_/g, ' ')}
                        </code>
                        <div className="flex gap-1">
                          {token.swatches.map((swatch, idx) => (
                            <div 
                              key={idx}
                              className={cn("h-4 w-4 rounded border border-border", swatch.class)}
                              title={swatch.label}
                            />
                          ))}
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
