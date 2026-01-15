import { useState } from 'react';
import { Shift, StaffMember, ShiftSpecialType } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Edit, 
  Trash2, 
  ArrowLeftRight, 
  Copy, 
  ChevronDown,
  Phone,
  Moon,
  Zap,
  PhoneCall,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapse } from '@mui/material';

const SHIFT_TYPE_CONFIG: Record<ShiftSpecialType, { icon: typeof Phone; color: string; bgColor: string; label: string }> = {
  regular: { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted/50', label: 'Regular' },
  on_call: { icon: Phone, color: 'text-blue-500', bgColor: 'bg-blue-500/20', label: 'On-Call' },
  sleepover: { icon: Moon, color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Sleepover' },
  broken: { icon: Zap, color: 'text-orange-500', bgColor: 'bg-orange-500/20', label: 'Split' },
  recall: { icon: PhoneCall, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Recall' },
  emergency: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/20', label: 'Emergency' },
};

interface MobileShiftCardProps {
  shift: Shift;
  staff?: StaffMember;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shiftId: string) => void;
  onCopy?: (shift: Shift) => void;
  onSwap?: (shift: Shift) => void;
}

export function MobileShiftCard({ 
  shift, 
  staff, 
  onEdit, 
  onDelete,
  onCopy,
  onSwap 
}: MobileShiftCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const duration = calculateDuration(shift.startTime, shift.endTime, shift.breakMinutes);
  const currentType = shift.shiftType || 'regular';
  const shiftTypeInfo = SHIFT_TYPE_CONFIG[currentType];
  const ShiftTypeIcon = shiftTypeInfo.icon;

  const handleCardTap = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
    setIsExpanded(false);
  };

  return (
    <div
      onClick={handleCardTap}
      className={cn(
        "relative rounded-lg border overflow-hidden transition-all duration-200 w-full",
        "active:scale-[0.98]",
        isExpanded && "ring-2 ring-primary/30 shadow-md",
        shift.status === 'draft' && "border-dashed opacity-80"
      )}
      style={{
        backgroundColor: staff?.color ? `${staff.color}15` : 'hsl(var(--muted))',
        borderColor: staff?.color || 'hsl(var(--border))',
      }}
    >
      {/* Color indicator bar */}
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: staff?.color || 'hsl(var(--muted-foreground))' }}
      />

      {/* Main content */}
      <div className="pl-3 pr-2 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span 
              className="text-sm font-medium truncate"
              style={{ color: staff?.color || 'hsl(var(--foreground))' }}
            >
              {staff?.name || 'Unassigned'}
            </span>
            
            {currentType !== 'regular' && (
              <div className={cn("p-1 rounded", shiftTypeInfo.bgColor)}>
                <ShiftTypeIcon className={cn("h-3 w-3", shiftTypeInfo.color)} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{shift.startTime}-{shift.endTime}</span>
            </div>
            
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-180"
              )} 
            />
          </div>
        </div>

        {/* Duration and badges row */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground">
            {duration}h
          </span>
          {currentType !== 'regular' && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
              {shiftTypeInfo.label}
            </Badge>
          )}
          {shift.status === 'draft' && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
              Draft
            </Badge>
          )}
        </div>
      </div>

      {/* Expandable action buttons */}
      <Collapse in={isExpanded}>
        <div className="border-t border-border/50 bg-background/50 px-2 py-2">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-14 flex-col gap-1 text-xs"
              onClick={handleAction(() => onEdit?.(shift))}
            >
              <Edit className="h-5 w-5" />
              Edit
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-14 flex-col gap-1 text-xs"
              onClick={handleAction(() => onSwap?.(shift))}
            >
              <ArrowLeftRight className="h-5 w-5" />
              Swap
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-14 flex-col gap-1 text-xs"
              onClick={handleAction(() => onCopy?.(shift))}
            >
              <Copy className="h-5 w-5" />
              Copy
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-14 flex-col gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleAction(() => onDelete?.(shift.id))}
            >
              <Trash2 className="h-5 w-5" />
              Delete
            </Button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

function calculateDuration(start: string, end: string, breakMinutes: number): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - breakMinutes;
  return Math.round(totalMinutes / 60 * 10) / 10;
}
