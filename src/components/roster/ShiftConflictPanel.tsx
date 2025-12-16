import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Calendar,
  BedDouble,
  Briefcase,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift, StaffMember, ShiftConflict, Room } from '@/types/roster';
import { detectShiftConflicts, getConflictSeverityColor } from '@/lib/shiftConflictDetection';

interface ShiftConflictPanelProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  staff: StaffMember[];
  rooms: Room[];
  onNavigateToShift?: (shiftId: string) => void;
}

export function ShiftConflictPanel({
  open,
  onClose,
  shifts,
  staff,
  rooms,
  onNavigateToShift,
}: ShiftConflictPanelProps) {
  const allConflicts = useMemo(() => {
    const conflicts: ShiftConflict[] = [];
    
    shifts.forEach(shift => {
      const shiftConflicts = detectShiftConflicts(shift, shifts, staff, rooms);
      conflicts.push(...shiftConflicts);
    });
    
    // Deduplicate by id
    const unique = Array.from(new Map(conflicts.map(c => [c.id, c])).values());
    return unique;
  }, [shifts, staff, rooms]);

  const errorConflicts = allConflicts.filter(c => c.severity === 'error');
  const warningConflicts = allConflicts.filter(c => c.severity === 'warning');

  const getConflictIcon = (type: ShiftConflict['type']) => {
    switch (type) {
      case 'overlap': return XCircle;
      case 'outside_availability': return Clock;
      case 'overtime_exceeded': return Briefcase;
      case 'insufficient_rest': return BedDouble;
      case 'max_consecutive_days': return Calendar;
      case 'on_leave': return Calendar;
      default: return AlertTriangle;
    }
  };

  const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || 'Unknown';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[450px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Shift Conflicts
            </span>
            <div className="flex items-center gap-2">
              {errorConflicts.length > 0 && (
                <Badge variant="destructive">{errorConflicts.length} errors</Badge>
              )}
              {warningConflicts.length > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {warningConflicts.length} warnings
                </Badge>
              )}
            </div>
          </SheetTitle>
          <SheetDescription>
            Review and resolve scheduling conflicts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({allConflicts.length})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errors ({errorConflicts.length})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings ({warningConflicts.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-240px)] mt-4">
              <TabsContent value="all" className="space-y-3 m-0">
                {allConflicts.length === 0 ? (
                  <NoConflicts />
                ) : (
                  allConflicts.map(conflict => (
                    <ConflictItem
                      key={conflict.id}
                      conflict={conflict}
                      staffName={getStaffName(conflict.staffId)}
                      getIcon={getConflictIcon}
                      onNavigate={() => onNavigateToShift?.(conflict.shiftId)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="errors" className="space-y-3 m-0">
                {errorConflicts.length === 0 ? (
                  <NoConflicts type="error" />
                ) : (
                  errorConflicts.map(conflict => (
                    <ConflictItem
                      key={conflict.id}
                      conflict={conflict}
                      staffName={getStaffName(conflict.staffId)}
                      getIcon={getConflictIcon}
                      onNavigate={() => onNavigateToShift?.(conflict.shiftId)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="warnings" className="space-y-3 m-0">
                {warningConflicts.length === 0 ? (
                  <NoConflicts type="warning" />
                ) : (
                  warningConflicts.map(conflict => (
                    <ConflictItem
                      key={conflict.id}
                      conflict={conflict}
                      staffName={getStaffName(conflict.staffId)}
                      getIcon={getConflictIcon}
                      onNavigate={() => onNavigateToShift?.(conflict.shiftId)}
                    />
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NoConflicts({ type }: { type?: 'error' | 'warning' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
      <p className="font-medium">No {type ? `${type}s` : 'conflicts'} found</p>
      <p className="text-sm text-muted-foreground">
        {type === 'error' ? 'All critical issues have been resolved' : 
         type === 'warning' ? 'No scheduling warnings detected' : 
         'The schedule looks good!'}
      </p>
    </div>
  );
}

interface ConflictItemProps {
  conflict: ShiftConflict;
  staffName: string;
  getIcon: (type: ShiftConflict['type']) => React.ElementType;
  onNavigate?: () => void;
}

function ConflictItem({ conflict, staffName, getIcon, onNavigate }: ConflictItemProps) {
  const Icon = getIcon(conflict.type);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        getConflictSeverityColor(conflict.severity)
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          conflict.severity === 'error' ? 'bg-destructive/20' : 'bg-amber-500/20'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{conflict.message}</p>
              <p className="text-xs opacity-70 mt-0.5">{staffName}</p>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "shrink-0 text-xs",
                conflict.canOverride ? "border-amber-500 text-amber-600" : "border-destructive text-destructive"
              )}
            >
              {conflict.canOverride ? 'Can override' : 'Must fix'}
            </Badge>
          </div>
          {conflict.details && (
            <p className="text-xs mt-2 opacity-80">{conflict.details}</p>
          )}
          <div className="flex items-center justify-end mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={onNavigate}
            >
              View Shift
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
