import { useState, useMemo } from 'react';
import { StaffMember, Shift, qualificationLabels, roleLabels } from '@/types/roster';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  GripVertical, 
  Clock, 
  AlertTriangle, 
  Award,
  ChevronDown,
  ChevronRight,
  User,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ScheduledStaffPanelProps {
  staff: StaffMember[];
  shifts: Shift[];
  selectedCentreId: string;
  onDragStart: (e: React.DragEvent, staffMember: StaffMember, fromShiftId?: string) => void;
}

export function ScheduledStaffPanel({ staff, shifts, selectedCentreId, onDragStart }: ScheduledStaffPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<string[]>(['lead_educator', 'educator', 'assistant']);

  // Get staff who have shifts assigned in the selected centre
  const scheduledStaffIds = useMemo(() => {
    return new Set(
      shifts
        .filter(s => s.centreId === selectedCentreId)
        .map(s => s.staffId)
    );
  }, [shifts, selectedCentreId]);

  const scheduledStaff = useMemo(() => {
    let filtered = staff.filter(s => scheduledStaffIds.has(s.id));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.qualifications.some(q => q.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [staff, scheduledStaffIds, searchQuery]);

  const groupedStaff = useMemo(() => {
    const groups: Record<string, StaffMember[]> = {};
    scheduledStaff.forEach(s => {
      if (!groups[s.role]) groups[s.role] = [];
      groups[s.role].push(s);
    });
    return groups;
  }, [scheduledStaff]);

  const toggleRole = (role: string) => {
    setExpandedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getStaffShiftCount = (staffId: string) => {
    return shifts.filter(s => s.staffId === staffId && s.centreId === selectedCentreId).length;
  };

  const getOvertimeStatus = (member: StaffMember) => {
    const percentUsed = (member.currentWeeklyHours / member.maxHoursPerWeek) * 100;
    if (percentUsed >= 100) return 'overtime';
    if (percentUsed >= 90) return 'near-limit';
    return 'available';
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Scheduled Staff
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.keys(groupedStaff).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs text-center">No staff scheduled<br/>for this centre</p>
            </div>
          ) : (
            Object.entries(groupedStaff).map(([role, members]) => (
              <Collapsible 
                key={role} 
                open={expandedRoles.includes(role)}
                onOpenChange={() => toggleRole(role)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <div className="flex items-center gap-1.5">
                    {expandedRoles.includes(role) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <span>{roleLabels[role as keyof typeof roleLabels]}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-4">
                    {members.length}
                  </Badge>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="space-y-1 pl-1">
                    {members.map((member) => {
                      const overtimeStatus = getOvertimeStatus(member);
                      const shiftCount = getStaffShiftCount(member.id);
                      
                      return (
                        <TooltipProvider key={member.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                draggable
                                onDragStart={(e) => onDragStart(e, member)}
                                className={cn(
                                  "flex items-center gap-2 p-1.5 rounded-md cursor-grab active:cursor-grabbing",
                                  "bg-background hover:bg-muted/50 border border-transparent hover:border-border",
                                  "transition-all duration-200 group",
                                  overtimeStatus === 'overtime' && "border-destructive/50 bg-destructive/5"
                                )}
                              >
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                                
                                <div 
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
                                  style={{ backgroundColor: member.color }}
                                >
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {member.name}
                                  </p>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span>{shiftCount} shift{shiftCount !== 1 ? 's' : ''}</span>
                                    <span>•</span>
                                    <span>{member.currentWeeklyHours}h</span>
                                  </div>
                                </div>

                                {overtimeStatus === 'overtime' && (
                                  <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                                    OT
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div className="space-y-1">
                                <p className="font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.currentWeeklyHours}/{member.maxHoursPerWeek}h this week
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ${member.hourlyRate.toFixed(2)}/hr
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          Drag staff to reassign or remove
        </p>
      </div>
    </div>
  );
}
