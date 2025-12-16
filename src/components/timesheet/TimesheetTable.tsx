import { Timesheet } from '@/types/timesheet';
import { StatusBadge } from './StatusBadge';
import { validateCompliance } from '@/lib/complianceEngine';
import { format } from 'date-fns';
import { Eye, Edit2, MapPin, Coffee, AlertTriangle, ShieldCheck, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TimesheetTableProps {
  timesheets: Timesheet[];
  onView: (timesheet: Timesheet) => void;
  onEdit: (timesheet: Timesheet) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  showSelection?: boolean;
}

export function TimesheetTable({ 
  timesheets, 
  onView, 
  onEdit,
  selectedIds = new Set(),
  onSelectionChange,
  showSelection = false,
}: TimesheetTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-emerald-500 to-emerald-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatBreakTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Pre-compute compliance for all timesheets
  const timesheetCompliance = useMemo(() => {
    return timesheets.reduce((acc, ts) => {
      acc[ts.id] = validateCompliance(ts);
      return acc;
    }, {} as Record<string, ReturnType<typeof validateCompliance>>);
  }, [timesheets]);

  const handleSelectAll = () => {
    if (selectedIds.size === timesheets.length) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(timesheets.map(t => t.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange?.(newSet);
  };

  const allSelected = timesheets.length > 0 && selectedIds.size === timesheets.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < timesheets.length;

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden border border-border/50">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border bg-muted/30">
            {showSelection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className={cn(
                    "border-muted-foreground/50",
                    someSelected && "data-[state=checked]:bg-primary/50"
                  )}
                />
              </TableHead>
            )}
            <TableHead className="font-semibold text-foreground">Employee</TableHead>
            <TableHead className="font-semibold text-foreground">Location</TableHead>
            <TableHead className="font-semibold text-foreground">Week</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Hours</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Breaks</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Overtime</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Flags</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Status</TableHead>
            <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timesheets.map((timesheet, index) => {
            const compliance = timesheetCompliance[timesheet.id];
            const criticalCount = compliance?.flags.filter(f => f.severity === 'critical').length || 0;
            const warningCount = compliance?.flags.filter(f => f.severity === 'warning').length || 0;
            const isSelected = selectedIds.has(timesheet.id);
            
            return (
            <TableRow
              key={timesheet.id}
              className={cn(
                "hover:bg-muted/50 transition-all duration-200 animate-fade-in",
                isSelected && "bg-primary/5 hover:bg-primary/10"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {showSelection && (
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectOne(timesheet.id)}
                    className="border-muted-foreground/50"
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className={cn("h-10 w-10 shadow-sm", getAvatarColor(timesheet.employee.name))}>
                    <AvatarFallback className="text-white text-sm font-medium bg-transparent">
                      {getInitials(timesheet.employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-card-foreground">
                      {timesheet.employee.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {timesheet.employee.position}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="p-1.5 rounded-md bg-muted/50">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">{timesheet.location.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-card-foreground font-medium">
                  {format(new Date(timesheet.weekStartDate), 'MMM d')} -{' '}
                  {format(new Date(timesheet.weekEndDate), 'MMM d')}
                </p>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-semibold text-card-foreground text-lg">
                  {timesheet.totalHours}h
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-muted/30 border-border">
                      <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatBreakTime(timesheet.totalBreakMinutes)}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Total break time this week
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-center">
                <span
                  className={cn(
                    "font-semibold",
                    timesheet.overtimeHours > 0
                      ? 'text-status-pending'
                      : 'text-muted-foreground'
                  )}
                >
                  {timesheet.overtimeHours > 0 ? `+${timesheet.overtimeHours}h` : '0h'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {criticalCount > 0 || warningCount > 0 ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center justify-center gap-1.5">
                        {criticalCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-6 px-2 gap-1 shadow-sm">
                            <ShieldAlert className="h-3 w-3" />
                            {criticalCount}
                          </Badge>
                        )}
                        {warningCount > 0 && (
                          <Badge className="bg-status-pending/15 text-status-pending border-status-pending/30 text-xs h-6 px-2 gap-1 shadow-sm">
                            <AlertTriangle className="h-3 w-3" />
                            {warningCount}
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {criticalCount} critical, {warningCount} warnings
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-status-approved/10">
                        <ShieldCheck className="h-4 w-4 text-status-approved" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>No compliance issues</TooltipContent>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge status={timesheet.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(timesheet)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View details</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(timesheet)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit timesheet</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {timesheets.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium">No timesheets found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
