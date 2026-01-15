import { useState, useMemo } from 'react';
import { StaffMember, Shift, qualificationLabels, roleLabels, employmentTypeLabels, EmploymentType, AgencyType, agencyLabels, agencyColors } from '@/types/roster';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Search, 
  Clock, 
  AlertTriangle, 
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  CalendarDays,
  Building2,
  Sparkles,
  X,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MobileStaffPanelProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember[];
  agencyStaff: StaffMember[];
  shifts: Shift[];
  selectedCentreId: string;
  onDragStart: (e: React.DragEvent, staffMember: StaffMember) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MobileStaffPanel({ 
  isOpen,
  onClose,
  staff, 
  agencyStaff,
  shifts, 
  selectedCentreId, 
  onDragStart,
  onGenerateAI,
  isGenerating,
}: MobileStaffPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['permanent', 'casual']);

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

    return filtered;
  }, [staff, scheduledStaffIds, searchQuery, selectedCentreId]);

  const availableAgencyStaff = useMemo(() => {
    let filtered = agencyStaff.filter(s => !scheduledStaffIds.has(s.id));
    
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

    return filtered;
  }, [agencyStaff, scheduledStaffIds, searchQuery, selectedCentreId]);

  // Group by employment type
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

  // Group agency staff
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

  const renderStaffCard = (member: StaffMember) => {
    const overtimeStatus = getOvertimeStatus(member);
    const hasCertIssues = hasExpiringCertificates(member);
    const hoursRemaining = member.maxHoursPerWeek - member.currentWeeklyHours;
    
    return (
      <div
        key={member.id}
        draggable
        onDragStart={(e) => onDragStart(e, member)}
        className={cn(
          "p-3 rounded-lg cursor-grab active:cursor-grabbing touch-manipulation",
          "bg-background border border-border active:border-primary",
          "transition-all duration-200",
          overtimeStatus === 'overtime' && "border-destructive/50 bg-destructive/5 opacity-50",
          hasCertIssues && "border-amber-500/50"
        )}
      >
        <div className="flex items-start gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0" />
          
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
            style={{ backgroundColor: member.agency ? agencyColors[member.agency] : member.color }}
          >
            {member.name.split(' ').map(n => n[0]).join('')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">
                {member.name}
              </p>
              {overtimeStatus === 'overtime' && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Full</Badge>
              )}
              {hasCertIssues && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {roleLabels[member.role]} • ${member.hourlyRate}/hr
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className={cn(
                "flex items-center gap-1",
                hoursRemaining <= 0 && "text-destructive",
                hoursRemaining > 0 && hoursRemaining <= 8 && "text-amber-500"
              )}>
                <Clock className="h-3 w-3" />
                {hoursRemaining}h left
              </span>
            </div>
            
            {/* Qualifications */}
            <div className="flex flex-wrap gap-1 mt-2">
              {member.qualifications.slice(0, 3).map((q, idx) => (
                <Badge 
                  key={idx}
                  variant={q.isExpired ? 'destructive' : q.isExpiringSoon ? 'outline' : 'secondary'}
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    q.isExpiringSoon && "border-amber-500 text-amber-600"
                  )}
                >
                  {qualificationLabels[q.type].slice(0, 12)}
                </Badge>
              ))}
              {member.qualifications.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{member.qualifications.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] p-0 rounded-t-2xl overflow-x-hidden">
        <div className="flex flex-col h-full w-full overflow-x-hidden">
          {/* Header */}
          <SheetHeader className="px-4 py-4 border-b border-border w-full">
            <div className="flex items-center justify-between w-full">
              <SheetTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Available Staff
                <Badge variant="secondary" className="ml-1">
                  {availableStaff.length + availableAgencyStaff.length}
                </Badge>
              </SheetTitle>
            </div>
            
            {/* Search */}
            <div className="relative mt-3 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>

            {/* AI Generate Button */}
            <Button 
              onClick={onGenerateAI} 
              disabled={isGenerating}
              className="w-full mt-3 gap-2"
              size="default"
            >
              <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
              {isGenerating ? 'Generating...' : 'Generate AI Shifts'}
            </Button>
          </SheetHeader>

          {/* Staff List */}
          <ScrollArea className="flex-1 w-full">
            <div className="px-4 py-3 space-y-3 w-full">
              {/* Internal Staff */}
              <div>
                <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 rounded-lg mb-2">
                        <div className="flex items-center gap-2">
                          {expandedGroups.includes(empType) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>{employmentTypeLabels[empType]}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {members.length}
                        </Badge>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="space-y-2 mb-4">
                          {members.map(renderStaffCard)}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Agency Staff */}
              {availableAgencyStaff.length > 0 && (
                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5" />
                    Agency Staff
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
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 rounded-lg mb-2">
                          <div className="flex items-center gap-2">
                            {expandedGroups.includes(agency) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: agencyColors[agency] }}
                            />
                            <span>{agencyLabels[agency]}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {members.length}
                          </Badge>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="space-y-2 mb-4">
                            {members.map(renderStaffCard)}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {availableStaff.length === 0 && availableAgencyStaff.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No available staff found</p>
                  <p className="text-xs mt-1">All staff have been assigned or filtered out</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
