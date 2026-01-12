import { useState, useMemo } from 'react';
import { StaffMember, qualificationLabels, roleLabels } from '@/types/roster';
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
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface StaffPanelProps {
  staff: StaffMember[];
  selectedCentreId?: string;
  onDragStart: (e: React.DragEvent, staffMember: StaffMember) => void;
}

export function StaffPanel({ staff, selectedCentreId, onDragStart }: StaffPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<string[]>(['lead_educator', 'educator', 'assistant']);

  const filteredStaff = useMemo(() => {
    let filtered = staff;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.qualifications.some(q => q.name.toLowerCase().includes(query))
      );
    }

    if (selectedCentreId) {
      filtered = filtered.filter(s => 
        s.preferredCentres.includes(selectedCentreId) || s.preferredCentres.length === 0
      );
    }

    return filtered;
  }, [staff, searchQuery, selectedCentreId]);

  const groupedStaff = useMemo(() => {
    const groups: Record<string, StaffMember[]> = {};
    filteredStaff.forEach(s => {
      if (!groups[s.role]) groups[s.role] = [];
      groups[s.role].push(s);
    });
    return groups;
  }, [filteredStaff]);

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
    <div className="w-72 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Staff</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(groupedStaff).map(([role, members]) => (
            <Collapsible 
              key={role} 
              open={expandedRoles.includes(role)}
              onOpenChange={() => toggleRole(role)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center gap-2">
                  {expandedRoles.includes(role) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>{roleLabels[role as keyof typeof roleLabels]}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {members.length}
                </Badge>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-1 pl-2">
                  {members.map((member) => {
                    const overtimeStatus = getOvertimeStatus(member);
                    const hasCertIssues = hasExpiringCertificates(member);
                    
                    return (
                      <TooltipProvider key={member.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('staffId', member.id);
                                e.dataTransfer.setData('dragType', 'staff');
                                e.dataTransfer.effectAllowed = 'copy';
                                onDragStart(e, member);
                              }}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing",
                                "bg-background hover:bg-muted/50 border border-transparent hover:border-border",
                                "transition-all duration-200 group",
                                overtimeStatus === 'overtime' && "border-destructive/50 bg-destructive/5",
                                hasCertIssues && "border-amber-500/50 bg-amber-500/5"
                              )}
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                              
                              <div 
                                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ backgroundColor: member.color }}
                              >
                                {member.avatar ? (
                                  <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  member.name.split(' ').map(n => n[0]).join('')
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {member.name}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{member.currentWeeklyHours}/{member.maxHoursPerWeek}h</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 items-end">
                                {overtimeStatus === 'overtime' && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    OT
                                  </Badge>
                                )}
                                {overtimeStatus === 'near-limit' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-500">
                                    90%
                                  </Badge>
                                )}
                                {hasCertIssues && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">
                                ${member.hourlyRate.toFixed(2)}/hr
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {member.qualifications.map((q, idx) => (
                                  <Badge 
                                    key={idx}
                                    variant={q.isExpired ? 'destructive' : q.isExpiringSoon ? 'outline' : 'secondary'}
                                    className={cn(
                                      "text-[10px]",
                                      q.isExpiringSoon && "border-amber-500 text-amber-500"
                                    )}
                                  >
                                    <Award className="h-2.5 w-2.5 mr-1" />
                                    {qualificationLabels[q.type]}
                                    {q.isExpired && ' (Expired)'}
                                    {q.isExpiringSoon && ' (Expiring)'}
                                  </Badge>
                                ))}
                              </div>
                              {overtimeStatus === 'overtime' && (
                                <p className="text-xs text-destructive">
                                  ⚠️ Already at max hours for this week
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {Object.keys(groupedStaff).length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No staff found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center justify-between mb-1">
            <span>Total Staff:</span>
            <span className="font-medium">{filteredStaff.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Available:</span>
            <span className="font-medium text-emerald-600">
              {filteredStaff.filter(s => getOvertimeStatus(s) !== 'overtime').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
