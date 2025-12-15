import { Timesheet } from '@/types/timesheet';
import { StatusBadge } from './StatusBadge';
import { validateCompliance } from '@/lib/complianceEngine';
import { format } from 'date-fns';
import { Eye, Edit2, MapPin, Coffee, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface TimesheetTableProps {
  timesheets: Timesheet[];
  onView: (timesheet: Timesheet) => void;
  onEdit: (timesheet: Timesheet) => void;
}

export function TimesheetTable({ timesheets, onView, onEdit }: TimesheetTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
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

  return (
    <div className="bg-card rounded-lg card-shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead className="font-semibold">Employee</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold">Week</TableHead>
            <TableHead className="font-semibold text-center">Hours</TableHead>
            <TableHead className="font-semibold text-center">Breaks</TableHead>
            <TableHead className="font-semibold text-center">Overtime</TableHead>
            <TableHead className="font-semibold text-center">Flags</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timesheets.map((timesheet, index) => {
            const compliance = timesheetCompliance[timesheet.id];
            const criticalCount = compliance?.flags.filter(f => f.severity === 'critical').length || 0;
            const warningCount = compliance?.flags.filter(f => f.severity === 'warning').length || 0;
            
            return (
            <TableRow
              key={timesheet.id}
              className="hover:bg-muted/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className={getAvatarColor(timesheet.employee.name)}>
                    <AvatarFallback className="text-white text-sm font-medium">
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
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{timesheet.location.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-card-foreground">
                  {format(new Date(timesheet.weekStartDate), 'MMM d')} -{' '}
                  {format(new Date(timesheet.weekEndDate), 'MMM d, yyyy')}
                </p>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-card-foreground">
                  {timesheet.totalHours}h
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="gap-1">
                      <Coffee className="h-3 w-3" />
                      {formatBreakTime(timesheet.totalBreakMinutes)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Total break time this week
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-center">
                <span
                  className={
                    timesheet.overtimeHours > 0
                      ? 'font-medium text-status-pending'
                      : 'text-muted-foreground'
                  }
                >
                  {timesheet.overtimeHours > 0 ? `+${timesheet.overtimeHours}h` : '0h'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {criticalCount > 0 || warningCount > 0 ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center justify-center gap-1">
                        {criticalCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-5 px-1.5">
                            <ShieldAlert className="h-3 w-3 mr-0.5" />
                            {criticalCount}
                          </Badge>
                        )}
                        {warningCount > 0 && (
                          <Badge className="bg-status-pending/10 text-status-pending border-status-pending/20 text-xs h-5 px-1.5">
                            <AlertTriangle className="h-3 w-3 mr-0.5" />
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
                      <ShieldCheck className="h-4 w-4 text-status-approved mx-auto" />
                    </TooltipTrigger>
                    <TooltipContent>No compliance issues</TooltipContent>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge status={timesheet.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(timesheet)}
                        className="h-8 w-8 p-0"
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
                        className="h-8 w-8 p-0"
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
        <div className="py-12 text-center text-muted-foreground">
          No timesheets found
        </div>
      )}
    </div>
  );
}
