import { Shift, StaffMember, OpenShift, qualificationLabels } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, MoreHorizontal, X, AlertCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ShiftCardProps {
  shift: Shift;
  staff?: StaffMember;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shiftId: string) => void;
  onDragStart?: (e: React.DragEvent, shift: Shift) => void;
  isCompact?: boolean;
}

export function ShiftCard({ 
  shift, 
  staff, 
  onEdit, 
  onDelete, 
  onDragStart,
  isCompact = false 
}: ShiftCardProps) {
  const duration = calculateDuration(shift.startTime, shift.endTime, shift.breakMinutes);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => onDragStart?.(e, shift)}
            className={cn(
              "group relative rounded-md border cursor-grab active:cursor-grabbing transition-all",
              "hover:shadow-md hover:scale-[1.02]",
              shift.status === 'draft' && "border-dashed opacity-80",
              shift.status === 'published' && "border-solid",
              isCompact ? "p-1.5" : "p-2"
            )}
            style={{
              backgroundColor: staff?.color ? `${staff.color}15` : 'hsl(var(--muted))',
              borderColor: staff?.color || 'hsl(var(--border))',
            }}
          >
            {/* Status indicator */}
            <div 
              className={cn(
                "absolute top-0 left-0 w-1 h-full rounded-l-md",
              )}
              style={{ backgroundColor: staff?.color || 'hsl(var(--muted-foreground))' }}
            />

            <div className="pl-2">
              {!isCompact && (
                <div className="flex items-start justify-between mb-1">
                  <span 
                    className="text-sm font-medium truncate"
                    style={{ color: staff?.color || 'hsl(var(--foreground))' }}
                  >
                    {staff?.name || 'Unassigned'}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(shift)}>
                        Edit Shift
                      </DropdownMenuItem>
                      <DropdownMenuItem>Swap Staff</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDelete?.(shift.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{shift.startTime} - {shift.endTime}</span>
                {!isCompact && (
                  <span className="text-muted-foreground/60">({duration}h)</span>
                )}
              </div>

              {!isCompact && shift.status === 'draft' && (
                <Badge variant="outline" className="mt-1 text-[10px] py-0">
                  Draft
                </Badge>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{staff?.name || 'Unassigned'}</p>
            <p className="text-muted-foreground">
              {shift.startTime} - {shift.endTime} ({duration}h)
            </p>
            {shift.breakMinutes > 0 && (
              <p className="text-muted-foreground">
                Break: {shift.breakMinutes} min
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface OpenShiftCardProps {
  openShift: OpenShift;
  onAssign?: (openShift: OpenShift) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, openShift: OpenShift) => void;
  isCompact?: boolean;
}

export function OpenShiftCard({ 
  openShift, 
  onAssign,
  onDragOver,
  onDrop,
  isCompact = false 
}: OpenShiftCardProps) {
  const urgencyColors = {
    low: 'border-muted-foreground/30 bg-muted/30',
    medium: 'border-amber-500/50 bg-amber-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    critical: 'border-destructive/50 bg-destructive/10 animate-pulse',
  };

  return (
    <div
      className={cn(
        "relative rounded-md border-2 border-dashed p-2 transition-all",
        urgencyColors[openShift.urgency],
        "hover:border-primary/50 hover:bg-primary/5"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => onDrop?.(e, openShift)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <AlertCircle className={cn(
            "h-4 w-4",
            openShift.urgency === 'critical' && "text-destructive",
            openShift.urgency === 'high' && "text-orange-500",
            openShift.urgency === 'medium' && "text-amber-500",
            openShift.urgency === 'low' && "text-muted-foreground",
          )} />
          <span className="text-sm font-medium text-foreground">Open Shift</span>
        </div>
        <Badge 
          variant={openShift.urgency === 'critical' ? 'destructive' : 'outline'}
          className="text-[10px] capitalize"
        >
          {openShift.urgency}
        </Badge>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>{openShift.startTime} - {openShift.endTime}</span>
      </div>

      {!isCompact && (
        <>
          <div className="flex flex-wrap gap-1 mb-2">
            {openShift.requiredQualifications.map((qual) => (
              <Badge key={qual} variant="secondary" className="text-[10px]">
                {qualificationLabels[qual]}
              </Badge>
            ))}
          </div>

          {openShift.applicants.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{openShift.applicants.length} applicant(s)</span>
            </div>
          )}
        </>
      )}

      <Button 
        size="sm" 
        variant="outline" 
        className="w-full mt-2 h-7 text-xs"
        onClick={() => onAssign?.(openShift)}
      >
        Fill Shift
      </Button>
    </div>
  );
}

function calculateDuration(start: string, end: string, breakMinutes: number): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - breakMinutes;
  return Math.round(totalMinutes / 60 * 10) / 10;
}
