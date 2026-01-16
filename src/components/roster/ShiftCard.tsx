import { useState, useRef, useEffect } from 'react';
import { Shift, StaffMember, OpenShift, qualificationLabels, ShiftSpecialType } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { Clock, MoreHorizontal, X, AlertCircle, Users, Copy, ArrowLeftRight, Edit, Phone, Moon, Zap, Car, ArrowUpCircle, PhoneCall, Sparkles, Bot, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const SHIFT_TYPE_CONFIG: Record<ShiftSpecialType, { icon: typeof Phone; color: string; bgColor: string; label: string }> = {
  regular: { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted/50', label: 'Regular' },
  on_call: { icon: Phone, color: 'text-blue-500', bgColor: 'bg-blue-500/20', label: 'On-Call' },
  sleepover: { icon: Moon, color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Sleepover' },
  broken: { icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-500/20', label: 'Split Shift' },
  recall: { icon: PhoneCall, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Recall' },
  emergency: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/20', label: 'Emergency' },
};

interface ShiftCardProps {
  shift: Shift;
  staff?: StaffMember;
  allStaff?: StaffMember[];
  onEdit?: (shift: Shift) => void;
  onDelete?: (shiftId: string) => void;
  onDragStart?: (e: React.DragEvent, shift: Shift) => void;
  onCopy?: (shift: Shift) => void;
  onSwap?: (shift: Shift) => void;
  onShiftTypeChange?: (shiftId: string, shiftType: ShiftSpecialType | undefined) => void;
  isCompact?: boolean;
}

export function ShiftCard({ 
  shift, 
  staff, 
  allStaff,
  onEdit, 
  onDelete, 
  onDragStart,
  onCopy,
  onSwap,
  onShiftTypeChange,
  isCompact = false 
}: ShiftCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const globalDrag = useGlobalDrag();
  const cardRef = useRef<HTMLDivElement>(null);
  const duration = calculateDuration(shift.startTime, shift.endTime, shift.breakMinutes);

  const currentType = shift.shiftType || 'regular';
  const shiftTypeInfo = SHIFT_TYPE_CONFIG[currentType];

  const handleShiftTypeQuickToggle = (type: ShiftSpecialType, e: React.MouseEvent) => {
    e.stopPropagation();
    const newType = currentType === type ? undefined : type;
    onShiftTypeChange?.(shift.id, newType);
  };

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
        shift.isAbsent && "border-destructive/60",
        isCompact ? "p-1.5" : "p-2"
      )}
      style={{
        backgroundColor: shift.isAbsent 
          ? undefined 
          : (staff?.color ? `${staff.color}15` : 'hsl(var(--muted))'),
        borderColor: shift.isAbsent 
          ? 'hsl(var(--destructive) / 0.6)' 
          : (staff?.color || 'hsl(var(--border))'),
        backgroundImage: shift.isAbsent 
          ? 'repeating-linear-gradient(135deg, hsl(var(--destructive) / 0.08), hsl(var(--destructive) / 0.08) 8px, hsl(var(--destructive) / 0.15) 8px, hsl(var(--destructive) / 0.15) 16px)' 
          : undefined,
      }}
    >
      {/* Status indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 w-1 h-full rounded-l-md",
        )}
        style={{ 
          backgroundColor: shift.isAbsent 
            ? 'hsl(var(--destructive))' 
            : (staff?.color || 'hsl(var(--muted-foreground))') 
        }}
      />

      {/* Absent overlay badge */}
      {shift.isAbsent && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <div className="bg-destructive text-destructive-foreground rounded-full p-1 shadow-md">
            <UserX className="h-3 w-3" />
          </div>
        </div>
      )}

      {/* Covered by chip */}
      {shift.isAbsent && shift.replacementStaffId && !isCompact && (
        <div className="absolute bottom-1 right-1 z-10">
          <Badge 
            variant="outline" 
            className="text-[9px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700"
          >
            Covered by {allStaff?.find(s => s.id === shift.replacementStaffId)?.name?.split(' ')[0] || 'Staff'}
          </Badge>
        </div>
      )}

      <div className="pl-2">
        {!isCompact && (
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1">
              <span 
                className="text-sm font-medium truncate"
                style={{ color: staff?.color || 'hsl(var(--foreground))' }}
              >
                {staff?.name || 'Unassigned'}
              </span>
              
              {/* AI Generated indicator */}
              {shift.isAIGenerated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="p-0.5 rounded bg-purple-500/20">
                        <Bot className="h-3 w-3 text-purple-500" />
                      </div>
                    </TooltipTrigger>
                    {showTooltipContent && (
                      <TooltipContent>
                        <p>AI-Assigned Shift</p>
                        {shift.aiGeneratedAt && (
                          <p className="text-xs text-muted-foreground">
                            Generated: {new Date(shift.aiGeneratedAt).toLocaleString()}
                          </p>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {currentType !== 'regular' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={cn("p-0.5 rounded", shiftTypeInfo.bgColor)}>
                        <shiftTypeInfo.icon className={cn("h-3 w-3", shiftTypeInfo.color)} />
                      </div>
                    </TooltipTrigger>
                    {showTooltipContent && (
                      <TooltipContent>
                        <p>{shiftTypeInfo.label} Shift</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
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
              <DropdownMenuContent align="end" className="w-56">
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
                
                {/* Quick Shift Type Actions */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Zap className="h-4 w-4 mr-2" />
                    Set Shift Type
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup 
                      value={currentType} 
                      onValueChange={(value) => onShiftTypeChange?.(shift.id, value === 'regular' ? undefined : value as ShiftSpecialType)}
                    >
                      {Object.entries(SHIFT_TYPE_CONFIG).map(([type, config]) => {
                        const TypeIcon = config.icon;
                        return (
                          <DropdownMenuRadioItem key={type} value={type}>
                            <TypeIcon className={cn("h-4 w-4 mr-2", config.color)} />
                            {config.label}
                          </DropdownMenuRadioItem>
                        );
                      })}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
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

        {/* Quick shift type toggle buttons - show on hover */}
        {!isCompact && onShiftTypeChange && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 p-0",
                      currentType === 'on_call' && "bg-blue-500/20 text-blue-600"
                    )}
                    onClick={(e) => handleShiftTypeQuickToggle('on_call', e)}
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                {showTooltipContent && (
                  <TooltipContent side="bottom" className="text-xs">
                    {currentType === 'on_call' ? 'Remove On-Call' : 'Mark as On-Call'}
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 p-0",
                      currentType === 'sleepover' && "bg-purple-500/20 text-purple-600"
                    )}
                    onClick={(e) => handleShiftTypeQuickToggle('sleepover', e)}
                  >
                    <Moon className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                {showTooltipContent && (
                  <TooltipContent side="bottom" className="text-xs">
                    {currentType === 'sleepover' ? 'Remove Sleepover' : 'Mark as Sleepover'}
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 p-0",
                      currentType === 'broken' && "bg-orange-500/20 text-orange-600"
                    )}
                    onClick={(e) => handleShiftTypeQuickToggle('broken', e)}
                  >
                    <Zap className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                {showTooltipContent && (
                  <TooltipContent side="bottom" className="text-xs">
                    {currentType === 'broken' ? 'Remove Split Shift' : 'Mark as Split Shift'}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

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
