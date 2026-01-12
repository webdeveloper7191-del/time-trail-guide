import { useState, useRef, useEffect } from 'react';
import { Shift, StaffMember, OpenShift, qualificationLabels } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { Clock, MoreHorizontal, X, AlertCircle, Users, Coffee, Calendar, Award, MapPin, Copy, ArrowLeftRight, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Global drag state to disable tooltips during any drag operation
let globalDragInProgress = false;
const dragListeners = new Set<() => void>();

const setGlobalDrag = (isDragging: boolean) => {
  globalDragInProgress = isDragging;
  dragListeners.forEach(listener => listener());
};

const useGlobalDrag = () => {
  const [isDragging, setIsDragging] = useState(globalDragInProgress);
  
  useEffect(() => {
    const listener = () => setIsDragging(globalDragInProgress);
    dragListeners.add(listener);
    return () => { dragListeners.delete(listener); };
  }, []);
  
  return isDragging;
};

interface ShiftCardProps {
  shift: Shift;
  staff?: StaffMember;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shiftId: string) => void;
  onDragStart?: (e: React.DragEvent, shift: Shift) => void;
  onCopy?: (shift: Shift) => void;
  onSwap?: (shift: Shift) => void;
  isCompact?: boolean;
}

export function ShiftCard({ 
  shift, 
  staff, 
  onEdit, 
  onDelete, 
  onDragStart,
  onCopy,
  onSwap,
  isCompact = false 
}: ShiftCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const globalDrag = useGlobalDrag();
  const cardRef = useRef<HTMLDivElement>(null);
  const duration = calculateDuration(shift.startTime, shift.endTime, shift.breakMinutes);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    setGlobalDrag(true);
    onDragStart?.(e, shift);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setGlobalDrag(false);
  };
  
  // Don't show anything if global drag is in progress (hides tooltips during drag)
  const showTooltipContent = !globalDrag && !isDragging;

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "group relative rounded-md border cursor-grab active:cursor-grabbing",
        "transition-all duration-200 ease-out",
        "hover:shadow-md hover:scale-[1.02]",
        isDragging && "opacity-50 scale-95 rotate-2 shadow-xl ring-2 ring-primary/50",
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
            
            {/* Three-dot menu for shift actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit?.(shift)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Shift
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy?.(shift)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Dates...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSwap?.(shift)}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Swap Staff
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete?.(shift.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete Shift
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
  const [isDragOver, setIsDragOver] = useState(false);
  const globalDrag = useGlobalDrag();
  const duration = calculateDuration(openShift.startTime, openShift.endTime, 0);

  const urgencyColors = {
    low: 'border-muted-foreground/30 bg-muted/30',
    medium: 'border-amber-500/50 bg-amber-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    critical: 'border-destructive/50 bg-destructive/10 animate-pulse',
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver?.(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop?.(e, openShift);
  };

  return (
    <div
      className={cn(
        "relative rounded-md border-2 border-dashed p-2",
        "transition-all duration-200 ease-out",
        urgencyColors[openShift.urgency],
        "hover:border-primary/50 hover:bg-primary/5",
        isDragOver && "scale-105 border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <AlertCircle className={cn(
            "h-4 w-4 transition-transform duration-200",
            isDragOver && "scale-110",
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
        className="w-full mt-2 h-7 text-xs transition-all duration-200 hover:scale-[1.02]"
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
