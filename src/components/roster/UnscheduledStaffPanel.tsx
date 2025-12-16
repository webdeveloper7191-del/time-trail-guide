import { useState, useMemo } from 'react';
import { StaffMember, Shift, qualificationLabels, roleLabels, QualificationType } from '@/types/roster';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  UserPlus,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UnscheduledStaffPanelProps {
  staff: StaffMember[];
  shifts: Shift[];
  selectedCentreId: string;
  onDragStart: (e: React.DragEvent, staffMember: StaffMember) => void;
}

export function UnscheduledStaffPanel({ staff, shifts, selectedCentreId, onDragStart }: UnscheduledStaffPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [expandedRoles, setExpandedRoles] = useState<string[]>(['lead_educator', 'educator', 'assistant']);

  // Get staff who don't have shifts in the selected centre
  const scheduledStaffIds = useMemo(() => {
    return new Set(
      shifts
        .filter(s => s.centreId === selectedCentreId)
        .map(s => s.staffId)
    );
  }, [shifts, selectedCentreId]);

  const unscheduledStaff = useMemo(() => {
    let filtered = staff.filter(s => !scheduledStaffIds.has(s.id));
    
    // Prefer staff who have this centre as preferred
    filtered = filtered.filter(s => 
      s.preferredCentres.includes(selectedCentreId) || s.preferredCentres.length === 0
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.qualifications.some(q => q.name.toLowerCase().includes(query))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(s => s.role === roleFilter);
    }

    if (qualificationFilter !== 'all') {
      filtered = filtered.filter(s => 
        s.qualifications.some(q => q.type === qualificationFilter)
      );
    }

    return filtered;
  }, [staff, scheduledStaffIds, searchQuery, roleFilter, qualificationFilter, selectedCentreId]);

  const groupedStaff = useMemo(() => {
    const groups: Record<string, StaffMember[]> = {};
    unscheduledStaff.forEach(s => {
      if (!groups[s.role]) groups[s.role] = [];
      groups[s.role].push(s);
    });
    return groups;
  }, [unscheduledStaff]);

  const toggleRole = (role: string) => {
    setExpandedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getOvertimeStatus = (member: StaffMember) => {
    const percentUsed = (member.currentWeeklyHours / member.maxHoursPerWeek) * 100;
    if (percentUsed >= 100) return 'overtime';
    if (percentUsed >= 90) return 'near-limit';
    return 'available';
  };

  const hasExpiringCertificates = (member: StaffMember) => {
    return member.qualifications.some(q => q.isExpiringSoon || q.isExpired);
  };

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Available Staff
        </h2>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(roleLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quals</SelectItem>
              {Object.entries(qualificationLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.keys(groupedStaff).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs text-center">No available staff<br/>matching filters</p>
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
                      const hasCertIssues = hasExpiringCertificates(member);
                      const hoursRemaining = member.maxHoursPerWeek - member.currentWeeklyHours;
                      
                      return (
                        <TooltipProvider key={member.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                draggable
                                onDragStart={(e) => onDragStart(e, member)}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-md cursor-grab active:cursor-grabbing",
                                  "bg-background hover:bg-muted/50 border border-transparent hover:border-border",
                                  "transition-all duration-200 group",
                                  overtimeStatus === 'overtime' && "border-destructive/50 bg-destructive/5 opacity-50",
                                  hasCertIssues && "border-amber-500/50"
                                )}
                              >
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                                
                                <div 
                                  className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
                                  style={{ backgroundColor: member.color }}
                                >
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {member.name}
                                  </p>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span className={cn(
                                      hoursRemaining <= 0 && "text-destructive",
                                      hoursRemaining > 0 && hoursRemaining <= 8 && "text-amber-500"
                                    )}>
                                      {hoursRemaining}h available
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-0.5 items-end">
                                  {overtimeStatus === 'overtime' && (
                                    <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                                      Full
                                    </Badge>
                                  )}
                                  {overtimeStatus === 'near-limit' && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500 text-amber-500">
                                      Low
                                    </Badge>
                                  )}
                                  {hasCertIssues && (
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-2">
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  ${member.hourlyRate.toFixed(2)}/hr • {member.currentWeeklyHours}/{member.maxHoursPerWeek}h
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {member.qualifications.slice(0, 3).map((q, idx) => (
                                    <Badge 
                                      key={idx}
                                      variant={q.isExpired ? 'destructive' : q.isExpiringSoon ? 'outline' : 'secondary'}
                                      className={cn(
                                        "text-[10px]",
                                        q.isExpiringSoon && "border-amber-500 text-amber-500"
                                      )}
                                    >
                                      {qualificationLabels[q.type]}
                                    </Badge>
                                  ))}
                                </div>
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
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Available: {unscheduledStaff.filter(s => getOvertimeStatus(s) !== 'overtime').length}</span>
          <span>Total: {unscheduledStaff.length}</span>
        </div>
      </div>
    </div>
  );
}
