import { useMemo } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Shift Conflicts"
      description="Review and resolve scheduling conflicts"
      icon={AlertTriangle}
      size="md"
      headerActions={
        <div className="flex items-center gap-2">
          {errorConflicts.length > 0 && (
            <Badge className="bg-destructive/10 text-destructive border border-destructive/30 rounded-full px-3">
              {errorConflicts.length} errors
            </Badge>
          )}
          {warningConflicts.length > 0 && (
            <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-300 dark:border-amber-700 rounded-full px-3">
              {warningConflicts.length} warnings
            </Badge>
          )}
        </div>
      }
      showFooter={false}
    >
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            All ({allConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="errors" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Errors ({errorConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="warnings" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Warnings ({warningConflicts.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-3">
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
        </div>
      </Tabs>
    </PrimaryOffCanvas>
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

  const getSeverityStyles = () => {
    if (conflict.severity === 'error') {
      return {
        container: 'bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800',
        icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
        text: 'text-red-700 dark:text-red-300',
        subtext: 'text-red-600 dark:text-red-400',
      };
    }
    return {
      container: 'bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700',
      icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
      text: 'text-amber-700 dark:text-amber-300',
      subtext: 'text-amber-600 dark:text-amber-400',
    };
  };

  const styles = getSeverityStyles();

  return (
    <div className={cn("p-4 rounded-xl transition-all", styles.container)}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2.5 rounded-lg shrink-0", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn("font-semibold text-sm", styles.text)}>{conflict.message}</p>
              <p className={cn("text-xs mt-0.5", styles.subtext)}>{staffName}</p>
            </div>
            <Badge 
              className={cn(
                "shrink-0 text-xs rounded-full px-3",
                conflict.canOverride 
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-300 dark:border-amber-700" 
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 border border-red-300 dark:border-red-700"
              )}
            >
              {conflict.canOverride ? 'Can override' : 'Must fix'}
            </Badge>
          </div>
          {conflict.details && (
            <p className={cn("text-xs mt-2", styles.subtext)}>{conflict.details}</p>
          )}
          <div className="flex items-center justify-end mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-7 text-xs", styles.text, "hover:bg-white/50 dark:hover:bg-black/20")}
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
