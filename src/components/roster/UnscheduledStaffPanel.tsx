import { useState, useMemo } from 'react';
import { StaffMember, Shift, qualificationLabels, roleLabels, employmentTypeLabels, EmploymentType, AgencyType, agencyLabels, agencyColors, Centre } from '@/types/roster';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  GripVertical, 
  Clock, 
  AlertTriangle, 
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User,
  UserPlus,
  Briefcase,
  CalendarDays,
  Building2,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  MapPin,
  Navigation,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UnscheduledStaffPanelProps {
  staff: StaffMember[];
  agencyStaff: StaffMember[];
  shifts: Shift[];
  selectedCentreId: string;
  centres: Centre[];
  onDragStart: (e: React.DragEvent, staffMember: StaffMember) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function UnscheduledStaffPanel({ 
  staff, 
  agencyStaff,
  shifts, 
  selectedCentreId,
  centres,
  onDragStart,
  onGenerateAI,
  isGenerating,
  isCollapsed = false,
  onToggleCollapse
}: UnscheduledStaffPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['permanent', 'casual', 'anzuk', 'randstad', 'quickcare', 'hays']);

  // Get staff who don't have shifts in the selected centre
  const scheduledStaffIds = useMemo(() => {
    return new Set(
      shifts
        .filter(s => s.centreId === selectedCentreId)
        .map(s => s.staffId)
    );
  }, [shifts, selectedCentreId]);

  const availableStaff = useMemo(() => {
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

    if (qualificationFilter !== 'all') {
      filtered = filtered.filter(s => 
        s.qualifications.some(q => q.type === qualificationFilter)
      );
    }

    return filtered;
  }, [staff, scheduledStaffIds, searchQuery, qualificationFilter, selectedCentreId]);

  const availableAgencyStaff = useMemo(() => {
    let filtered = agencyStaff.filter(s => !scheduledStaffIds.has(s.id));
    
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

    if (qualificationFilter !== 'all') {
      filtered = filtered.filter(s => 
        s.qualifications.some(q => q.type === qualificationFilter)
      );
    }

    return filtered;
  }, [agencyStaff, scheduledStaffIds, searchQuery, qualificationFilter, selectedCentreId]);

  // Group by employment type for internal staff
  const groupedStaff = useMemo(() => {
    const groups: Record<EmploymentType, StaffMember[]> = {
      permanent: [],
      casual: [],
    };
    availableStaff.forEach(s => {
      groups[s.employmentType].push(s);
    });
    return groups;
  }, [availableStaff]);

  // Group agency staff by agency
  const groupedAgencyStaff = useMemo(() => {
    const groups: Record<AgencyType, StaffMember[]> = {
      anzuk: [],
      randstad: [],
      quickcare: [],
      hays: [],
      internal: [],
    };
    availableAgencyStaff.forEach(s => {
      if (s.agency) groups[s.agency].push(s);
    });
    return groups;
  }, [availableAgencyStaff]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
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

  const getAvailableDays = (member: StaffMember) => {
    return member.availability
      .filter(a => a.available)
      .map(a => dayNames[a.dayOfWeek])
      .join(', ');
  };

  const getCentreName = (centreId: string) => {
    return centres.find(c => c.id === centreId)?.name || centreId;
  };

  const getDefaultCentreName = (member: StaffMember) => {
    if (member.defaultCentreId) {
      return getCentreName(member.defaultCentreId);
    }
    if (member.preferredCentres.length > 0) {
      return getCentreName(member.preferredCentres[0]);
    }
    return 'No default';
  };

  const isAtDefaultLocation = (member: StaffMember) => {
    return member.defaultCentreId === selectedCentreId || 
           (!member.defaultCentreId && member.preferredCentres[0] === selectedCentreId);
  };

  const renderStaffCard = (member: StaffMember) => {
    const overtimeStatus = getOvertimeStatus(member);
    const hasCertIssues = hasExpiringCertificates(member);
    const hoursRemaining = member.maxHoursPerWeek - member.currentWeeklyHours;
    const availableDays = getAvailableDays(member);
    const defaultCentreName = getDefaultCentreName(member);
    const atDefaultLocation = isAtDefaultLocation(member);
    
    return (
      <TooltipProvider key={member.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, member)}
              className={cn(
                "p-2 rounded-md cursor-grab active:cursor-grabbing",
                "bg-background hover:bg-muted/50 border border-transparent hover:border-border",
                "transition-all duration-200 group",
                overtimeStatus === 'overtime' && "border-destructive/50 bg-destructive/5 opacity-50",
                hasCertIssues && "border-amber-500/50"
              )}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground mt-1" />
                
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
                  style={{ backgroundColor: member.agency ? agencyColors[member.agency] : member.color }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {member.name}
                    </p>
                    {overtimeStatus === 'overtime' && (
                      <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Full</Badge>
                    )}
                    {hasCertIssues && (
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {roleLabels[member.role]} • ${member.hourlyRate}/hr
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    <span className={cn(
                      hoursRemaining <= 0 && "text-destructive",
                      hoursRemaining > 0 && hoursRemaining <= 8 && "text-amber-500"
                    )}>
                      {hoursRemaining}h available
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <CalendarDays className="h-2.5 w-2.5" />
                    <span className="truncate">{availableDays || 'No availability'}</span>
                  </div>
                  
                  {/* Location info */}
                  <div className="flex items-center gap-1 text-[10px] mt-0.5">
                    {atDefaultLocation ? (
                      <Home className="h-2.5 w-2.5 text-emerald-500" />
                    ) : (
                      <MapPin className="h-2.5 w-2.5 text-blue-500" />
                    )}
                    <span className={cn(
                      "truncate",
                      atDefaultLocation ? "text-emerald-600" : "text-blue-600"
                    )}>
                      {atDefaultLocation ? 'Home location' : defaultCentreName}
                    </span>
                    {member.willingToWorkMultipleLocations && (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 h-3 ml-1 border-blue-400 text-blue-600">
                        <Navigation className="h-2 w-2 mr-0.5" />
                        Multi
                      </Badge>
                    )}
                  </div>
                  
                  {/* Qualification badges */}
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {member.qualifications.slice(0, 2).map((q, idx) => (
                      <Badge 
                        key={idx}
                        variant={q.isExpired ? 'destructive' : q.isExpiringSoon ? 'outline' : 'secondary'}
                        className={cn(
                          "text-[8px] px-1 py-0 h-3.5",
                          q.isExpiringSoon && "border-amber-500 text-amber-600"
                        )}
                      >
                        {qualificationLabels[q.type].slice(0, 8)}
                      </Badge>
                    ))}
                    {member.qualifications.length > 2 && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">
                        +{member.qualifications.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">{member.name}</div>
              <div className="text-xs text-muted-foreground">
                {roleLabels[member.role]} • {member.agency ? agencyLabels[member.agency] : employmentTypeLabels[member.employmentType]}
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Rate:</span> ${member.hourlyRate}/hr
                <span className="text-muted-foreground ml-2">OT:</span> ${member.overtimeRate}/hr
              </div>
              
              {/* Location details in tooltip */}
              <div className="text-xs border-t border-border pt-2">
                <div className="flex items-center gap-1 mb-1">
                  <Home className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Default:</span>
                  <span className="font-medium">{defaultCentreName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Multi-location:</span>
                  <span className={member.willingToWorkMultipleLocations ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                    {member.willingToWorkMultipleLocations ? 'Yes' : 'No'}
                  </span>
                </div>
                {member.maxTravelDistanceKm && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Max travel:</span>
                    <span>{member.maxTravelDistanceKm}km</span>
                  </div>
                )}
                {member.preferredCentres.length > 1 && (
                  <div className="mt-1">
                    <span className="text-muted-foreground">Preferred centres:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {member.preferredCentres.map(cId => (
                        <Badge key={cId} variant="outline" className="text-[9px]">
                          {getCentreName(cId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {member.crossLocationNotes && (
                  <div className="mt-1 text-[10px] text-muted-foreground italic">
                    "{member.crossLocationNotes}"
                  </div>
                )}
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Hours:</span> {member.currentWeeklyHours}/{member.maxHoursPerWeek}h
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Available:</span> {availableDays}
              </div>
              <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
                {member.qualifications.map((q, idx) => (
                  <Badge 
                    key={idx}
                    variant={q.isExpired ? 'destructive' : q.isExpiringSoon ? 'outline' : 'secondary'}
                    className={cn(
                      "text-[9px]",
                      q.isExpiringSoon && "border-amber-500 text-amber-600"
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
  };

  // Collapsed view - just a thin bar with expand button
  if (isCollapsed) {
    return (
      <div className="w-12 shrink-0 border-l border-border bg-card flex flex-col h-full overflow-hidden">
        <div className="p-2 border-b border-border flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Expand staff panel"
          >
            <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center py-4 gap-3">
          <div className="writing-mode-vertical text-xs font-semibold text-muted-foreground uppercase tracking-wider rotate-180" style={{ writingMode: 'vertical-rl' }}>
            Available Staff
          </div>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {availableStaff.length + availableAgencyStaff.length}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] shrink-0 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Available Staff
          </h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Collapse panel"
            >
              <PanelRightClose className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Filter by qualification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Qualifications</SelectItem>
            {Object.entries(qualificationLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={onGenerateAI} 
          disabled={isGenerating}
          className="w-full mt-2 gap-2"
          size="sm"
        >
          <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
          {isGenerating ? 'Generating...' : 'Generate AI Shifts'}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Internal Staff */}
          <div className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Briefcase className="h-3.5 w-3.5" />
              Internal Staff
            </div>
            
            {(['permanent', 'casual'] as EmploymentType[]).map((empType) => {
              const members = groupedStaff[empType];
              if (members.length === 0) return null;

              return (
                <Collapsible 
                  key={empType} 
                  open={expandedGroups.includes(empType)}
                  onOpenChange={() => toggleGroup(empType)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-muted/50 rounded-md mb-1">
                    <div className="flex items-center gap-2">
                      {expandedGroups.includes(empType) ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      <span>{employmentTypeLabels[empType]}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {members.length}
                    </Badge>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="space-y-1.5 mb-3">
                      {members.map(renderStaffCard)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {/* Agency Staff */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              Recruitment Agencies
            </div>
            
            {(['anzuk', 'randstad', 'quickcare', 'hays'] as AgencyType[]).map((agency) => {
              const members = groupedAgencyStaff[agency];
              if (members.length === 0) return null;

              return (
                <Collapsible 
                  key={agency} 
                  open={expandedGroups.includes(agency)}
                  onOpenChange={() => toggleGroup(agency)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-muted/50 rounded-md mb-1">
                    <div className="flex items-center gap-2">
                      {expandedGroups.includes(agency) ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      <div 
                        className="h-2.5 w-2.5 rounded-full" 
                        style={{ backgroundColor: agencyColors[agency] }}
                      />
                      <span>{agencyLabels[agency]}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {members.length}
                    </Badge>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="space-y-1.5 mb-3">
                      {members.map(renderStaffCard)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {availableStaff.length === 0 && availableAgencyStaff.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs text-center">No available staff<br/>matching filters</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border bg-muted/30">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <div>
            <span className="font-medium">Internal:</span> {availableStaff.length}
          </div>
          <div>
            <span className="font-medium">Agency:</span> {availableAgencyStaff.length}
          </div>
        </div>
      </div>
    </div>
  );
}
