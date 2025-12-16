import { OpenShift, StaffMember, qualificationLabels, Centre } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertCircle, Users, Calendar, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';

interface OpenShiftsPoolProps {
  openShifts: OpenShift[];
  centres: Centre[];
  staff: StaffMember[];
  onAssign: (openShift: OpenShift) => void;
  onDropStaff: (staffId: string, openShift: OpenShift) => void;
}

export function OpenShiftsPool({ openShifts, centres, staff, onAssign, onDropStaff }: OpenShiftsPoolProps) {
  const [expandedCentres, setExpandedCentres] = useState<string[]>(centres.map(c => c.id));
  const [dragOverShift, setDragOverShift] = useState<string | null>(null);

  const groupedByCenter = useMemo(() => {
    const groups: Record<string, OpenShift[]> = {};
    openShifts.forEach(shift => {
      if (!groups[shift.centreId]) groups[shift.centreId] = [];
      groups[shift.centreId].push(shift);
    });
    return groups;
  }, [openShifts]);

  const toggleCentre = (centreId: string) => {
    setExpandedCentres(prev =>
      prev.includes(centreId)
        ? prev.filter(c => c !== centreId)
        : [...prev, centreId]
    );
  };

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const handleDrop = (e: React.DragEvent, openShift: OpenShift) => {
    e.preventDefault();
    setDragOverShift(null);
    const staffId = e.dataTransfer.getData('staffId');
    if (staffId) {
      onDropStaff(staffId, openShift);
    }
  };

  const getCentreName = (centreId: string) => centres.find(c => c.id === centreId)?.name || centreId;
  const getRoomName = (centreId: string, roomId: string) => {
    const centre = centres.find(c => c.id === centreId);
    return centre?.rooms.find(r => r.id === roomId)?.name || roomId;
  };

  const totalOpenShifts = openShifts.length;
  const criticalCount = openShifts.filter(s => s.urgency === 'critical').length;

  return (
    <div className="border-l border-border bg-card flex flex-col h-full w-72">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-foreground">Open Shifts</h2>
          <Badge variant={criticalCount > 0 ? "destructive" : "secondary"}>
            {totalOpenShifts} total
          </Badge>
        </div>
        {criticalCount > 0 && (
          <div className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {criticalCount} critical shift{criticalCount > 1 ? 's' : ''} need filling
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Drag staff here to assign to open shifts
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(groupedByCenter).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No open shifts</p>
            </div>
          ) : (
            Object.entries(groupedByCenter).map(([centreId, shifts]) => (
              <Collapsible
                key={centreId}
                open={expandedCentres.includes(centreId)}
                onOpenChange={() => toggleCentre(centreId)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <div className="flex items-center gap-2">
                    {expandedCentres.includes(centreId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{getCentreName(centreId)}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {shifts.length}
                  </Badge>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="space-y-2 pl-2 pb-2">
                    {shifts
                      .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
                      .map((openShift) => (
                        <OpenShiftPoolCard
                          key={openShift.id}
                          openShift={openShift}
                          roomName={getRoomName(openShift.centreId, openShift.roomId)}
                          staff={staff}
                          isDragOver={dragOverShift === openShift.id}
                          onDragOver={() => setDragOverShift(openShift.id)}
                          onDragLeave={() => setDragOverShift(null)}
                          onDrop={(e) => handleDrop(e, openShift)}
                          onAssign={() => onAssign(openShift)}
                        />
                      ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface OpenShiftPoolCardProps {
  openShift: OpenShift;
  roomName: string;
  staff: StaffMember[];
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onAssign: () => void;
}

function OpenShiftPoolCard({
  openShift,
  roomName,
  staff,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onAssign,
}: OpenShiftPoolCardProps) {
  const urgencyStyles = {
    low: 'border-muted-foreground/30 bg-muted/30',
    medium: 'border-amber-500/50 bg-amber-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    critical: 'border-destructive/50 bg-destructive/10',
  };

  const applicantNames = openShift.applicants
    .map(id => staff.find(s => s.id === id)?.name)
    .filter(Boolean);

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed p-3 transition-all",
        urgencyStyles[openShift.urgency],
        isDragOver && "border-primary bg-primary/10 scale-[1.02]",
        openShift.urgency === 'critical' && "animate-pulse"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{roomName}</span>
        <Badge
          variant={openShift.urgency === 'critical' ? 'destructive' : 'outline'}
          className="text-[10px] capitalize"
        >
          {openShift.urgency}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Calendar className="h-3 w-3" />
        <span>{format(parseISO(openShift.date), 'EEE, MMM d')}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>{openShift.startTime} - {openShift.endTime}</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {openShift.requiredQualifications.map((qual) => (
          <Badge key={qual} variant="secondary" className="text-[10px]">
            {qualificationLabels[qual]}
          </Badge>
        ))}
      </div>

      {applicantNames.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 cursor-help">
                <Users className="h-3 w-3" />
                <span>{applicantNames.length} applicant(s)</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {applicantNames.map((name, i) => (
                  <div key={i}>{name}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Button
        size="sm"
        variant="outline"
        className="w-full h-7 text-xs"
        onClick={onAssign}
      >
        Fill Shift
      </Button>
    </div>
  );
}
