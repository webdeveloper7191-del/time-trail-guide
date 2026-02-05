import { useState, useMemo } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
 import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit, 
  AlertTriangle,
  ChevronRight,
  Users,
  MapPin,
  X,
  CalendarX,
  Bell,
  CheckCircle2,
  Pause,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift, StaffMember, Centre } from '@/types/roster';
import { format, parseISO, differenceInDays, addDays, isBefore, isAfter } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface RecurringSeries {
  groupId: string;
  shifts: Shift[];
  staffId: string;
  staffName: string;
  pattern: string;
  daysOfWeek: number[];
  endType: string;
  endDate?: string;
  endAfterOccurrences?: number;
  startTime: string;
  endTime: string;
  roomId: string;
  centreId: string;
  totalShifts: number;
  completedShifts: number;
  remainingShifts: number;
  nextShiftDate: string | null;
  lastShiftDate: string | null;
  isExpiringSoon: boolean;
  daysUntilEnd: number | null;
}

interface RecurringShiftManagementPanelProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  staff: StaffMember[];
  centres: Centre[];
  onDeleteSeries: (groupId: string) => void;
  onEditSeries: (groupId: string) => void;
  onExtendSeries: (groupId: string, newEndDate: string) => void;
  onUpdateSeries?: (groupId: string, updates: { startTime?: string; endTime?: string; daysOfWeek?: number[]; effectiveDate?: string }) => void;
  onPauseSeries?: (groupId: string) => void;
}

export function RecurringShiftManagementPanel({
  open,
  onClose,
  shifts,
  staff,
  centres,
  onDeleteSeries,
  onEditSeries,
  onExtendSeries,
  onUpdateSeries,
  onPauseSeries,
}: RecurringShiftManagementPanelProps) {
  const [selectedSeries, setSelectedSeries] = useState<RecurringSeries | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [extendWeeks, setExtendWeeks] = useState(4);
  
  // Edit form state
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDaysOfWeek, setEditDaysOfWeek] = useState<number[]>([]);
  const [editEffectiveDate, setEditEffectiveDate] = useState('');
  
  const DAYS_OF_WEEK = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];
  
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const handleOpenEditModal = () => {
    if (selectedSeries) {
      setEditStartTime(selectedSeries.startTime);
      setEditEndTime(selectedSeries.endTime);
      setEditDaysOfWeek(selectedSeries.daysOfWeek);
      setEditEffectiveDate(today); // Default to today
      setShowEditModal(true);
    }
  };
  
  const handleSaveEdit = () => {
    if (selectedSeries && onUpdateSeries) {
      onUpdateSeries(selectedSeries.groupId, {
        startTime: editStartTime,
        endTime: editEndTime,
        daysOfWeek: editDaysOfWeek,
        effectiveDate: editEffectiveDate,
      });
      const effectiveDateLabel = editEffectiveDate === today 
        ? 'today' 
        : format(parseISO(editEffectiveDate), 'MMM d, yyyy');
      toast.success(`Series updated - changes effective from ${effectiveDateLabel}`);
      setShowEditModal(false);
    } else if (!onUpdateSeries) {
      toast.info('Edit functionality coming soon');
      setShowEditModal(false);
    }
  };
  
  const toggleEditDay = (day: number) => {
    setEditDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const recurringSeries = useMemo(() => {
    const seriesMap = new Map<string, Shift[]>();
    const today = new Date();
    
    // Group shifts by recurrence group ID
    shifts.forEach(shift => {
      if (shift.recurring?.isRecurring && shift.recurring.recurrenceGroupId) {
        const groupId = shift.recurring.recurrenceGroupId;
        if (!seriesMap.has(groupId)) {
          seriesMap.set(groupId, []);
        }
        seriesMap.get(groupId)!.push(shift);
      }
    });

    // Build series summaries
    const series: RecurringSeries[] = [];
    
    seriesMap.forEach((seriesShifts, groupId) => {
      // Sort by date
      const sortedShifts = seriesShifts.sort((a, b) => 
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );
      
      const firstShift = sortedShifts[0];
      const lastShift = sortedShifts[sortedShifts.length - 1];
      const staffMember = staff.find(s => s.id === firstShift.staffId);
      
      const completedShifts = sortedShifts.filter(s => 
        isBefore(parseISO(s.date), today) || s.status === 'completed'
      ).length;
      
      const futureShifts = sortedShifts.filter(s => 
        isAfter(parseISO(s.date), today) || format(parseISO(s.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      );
      
      const nextShift = futureShifts[0];
      
      // Calculate if expiring soon (within 14 days)
      const endDate = firstShift.recurring?.endDate;
      let daysUntilEnd: number | null = null;
      let isExpiringSoon = false;
      
      if (endDate) {
        daysUntilEnd = differenceInDays(parseISO(endDate), today);
        isExpiringSoon = daysUntilEnd <= 14 && daysUntilEnd >= 0;
      } else if (firstShift.recurring?.endType === 'after_occurrences') {
        const remaining = sortedShifts.length - completedShifts;
        isExpiringSoon = remaining <= 3;
        if (lastShift) {
          daysUntilEnd = differenceInDays(parseISO(lastShift.date), today);
        }
      }

      series.push({
        groupId,
        shifts: sortedShifts,
        staffId: firstShift.staffId,
        staffName: staffMember?.name || 'Unknown',
        pattern: firstShift.recurring?.pattern || 'weekly',
        daysOfWeek: firstShift.recurring?.daysOfWeek || [],
        endType: firstShift.recurring?.endType || 'never',
        endDate: firstShift.recurring?.endDate,
        endAfterOccurrences: firstShift.recurring?.endAfterOccurrences,
        startTime: firstShift.startTime,
        endTime: firstShift.endTime,
        roomId: firstShift.roomId,
        centreId: firstShift.centreId,
        totalShifts: sortedShifts.length,
        completedShifts,
        remainingShifts: sortedShifts.length - completedShifts,
        nextShiftDate: nextShift?.date || null,
        lastShiftDate: lastShift?.date || null,
        isExpiringSoon,
        daysUntilEnd,
      });
    });

    // Sort by expiring soon first, then by next shift date
    return series.sort((a, b) => {
      if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
      if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
      if (a.nextShiftDate && b.nextShiftDate) {
        return parseISO(a.nextShiftDate).getTime() - parseISO(b.nextShiftDate).getTime();
      }
      return 0;
    });
  }, [shifts, staff]);

  const expiringSeries = recurringSeries.filter(s => s.isExpiringSoon);

  const handleDeleteSeries = () => {
    if (selectedSeries) {
      onDeleteSeries(selectedSeries.groupId);
      toast.success(`Deleted ${selectedSeries.remainingShifts} upcoming shifts in series`);
      setShowDeleteConfirm(false);
      setSelectedSeries(null);
    }
  };

  const handleExtendSeries = () => {
    if (selectedSeries && selectedSeries.lastShiftDate) {
      const newEndDate = format(addDays(parseISO(selectedSeries.lastShiftDate), extendWeeks * 7), 'yyyy-MM-dd');
      onExtendSeries(selectedSeries.groupId, newEndDate);
      toast.success(`Extended series by ${extendWeeks} weeks`);
      setShowExtendModal(false);
      setSelectedSeries(null);
    }
  };

  const getDayLabels = (days: number[]): string => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const getPatternLabel = (pattern: string): string => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      fortnightly: 'Fortnightly',
      monthly: 'Monthly',
    };
    return labels[pattern] || pattern;
  };

  const getRoomName = (centreId: string, roomId: string): string => {
    const centre = centres.find(c => c.id === centreId);
    const room = centre?.rooms.find(r => r.id === roomId);
    return room?.name || 'Unknown Room';
  };

  return (
    <>
      <PrimaryOffCanvas
        open={open}
        onClose={onClose}
        title="Recurring Shift Series"
        icon={RefreshCw}
         size="lg"
      >
        <div className="flex flex-col h-full">
          {/* Expiring Soon Section */}
          {expiringSeries.length > 0 && (
             <FormSection title="Expiring Soon" variant="card" className="border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/30">
               <div className="flex items-center gap-2 mb-2 -mt-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {expiringSeries.length} series ending soon
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {expiringSeries.slice(0, 3).map(series => (
                  <Button
                    key={series.groupId}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white dark:bg-background border-amber-300 dark:border-amber-700"
                    onClick={() => setSelectedSeries(series)}
                  >
                    {series.staffName}
                    <Badge variant="secondary" className="ml-1 text-[10px] h-4">
                      {series.daysUntilEnd !== null ? `${series.daysUntilEnd}d` : `${series.remainingShifts} left`}
                    </Badge>
                  </Button>
                ))}
              </div>
             </FormSection>
          )}

          {/* Main Content */}
          <ScrollArea className="flex-1">
             <div className="space-y-3 mt-4">
              {recurringSeries.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground bg-background rounded-lg border border-border">
                  <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No recurring shift series configured</p>
                  <p className="text-xs mt-1">Create shifts with recurring patterns to see them here</p>
                </div>
              ) : (
                recurringSeries.map(series => (
                  <div
                    key={series.groupId}
                    className={cn(
                       "p-4 rounded-lg border border-l-4 border-l-primary bg-background transition-all cursor-pointer",
                       "hover:shadow-sm",
                       series.isExpiringSoon && "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
                       selectedSeries?.groupId === series.groupId && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedSeries(series)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{series.staffName}</span>
                            {series.isExpiringSoon && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                                <Bell className="h-2.5 w-2.5 mr-0.5" />
                                Ending Soon
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {getPatternLabel(series.pattern)} • {getDayLabels(series.daysOfWeek)}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Time</span>
                        <div className="font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {series.startTime} - {series.endTime}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Room</span>
                        <div className="font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {getRoomName(series.centreId, series.roomId)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Progress</span>
                        <div className="font-medium flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          {series.completedShifts}/{series.totalShifts}
                        </div>
                      </div>
                    </div>

                    {series.nextShiftDate && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Next shift:</span>
                        <span className="font-medium">
                          {format(parseISO(series.nextShiftDate), 'EEE, MMM d')}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Selected Series Actions */}
          {selectedSeries && (
            <div className="border-t p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{selectedSeries.staffName}'s Series</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSeries(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditModal}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Series
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtendModal(true)}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Extend
                </Button>
                {onPauseSeries && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPauseSeries(selectedSeries.groupId)}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Cancel Series
                </Button>
              </div>
            </div>
          )}
        </div>
      </PrimaryOffCanvas>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Recurring Series?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will delete <strong>{selectedSeries?.remainingShifts}</strong> upcoming shifts 
              for <strong>{selectedSeries?.staffName}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Past shifts ({selectedSeries?.completedShifts}) will be preserved for record keeping.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Keep Series
            </Button>
            <Button variant="destructive" onClick={handleDeleteSeries}>
              <Trash2 className="h-4 w-4 mr-1" />
              Cancel {selectedSeries?.remainingShifts} Shifts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Series Side Panel */}
      <PrimaryOffCanvas
        open={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title="Extend Recurring Series"
        description={`Extend ${selectedSeries?.staffName}'s shift series`}
        icon={Calendar}
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowExtendModal(false), variant: 'outlined' },
          { 
            label: 'Extend Series', 
            onClick: handleExtendSeries, 
            variant: 'primary',
            icon: <Calendar className="h-4 w-4" />
          },
        ]}
      >
        <div className="space-y-5">
          {/* Current End Date */}
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-1">Current series ends on</p>
            <p className="text-base font-semibold text-foreground">
              {selectedSeries?.lastShiftDate 
                ? format(parseISO(selectedSeries.lastShiftDate), 'EEEE, MMMM d, yyyy')
                : 'N/A'}
            </p>
          </div>

          {/* Extend By Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Extend by:</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 8, 12].map(weeks => (
                <Button
                  key={weeks}
                  variant={extendWeeks === weeks ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExtendWeeks(weeks)}
                  className={extendWeeks === weeks ? 'bg-primary text-primary-foreground' : ''}
                >
                  {weeks} weeks
                </Button>
              ))}
            </div>
          </div>

          {/* New End Date Preview */}
          {selectedSeries?.lastShiftDate && (
            <div className="bg-primary/5 border border-primary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">New end date</p>
              <p className="text-base font-semibold text-primary">
                {format(addDays(parseISO(selectedSeries.lastShiftDate), extendWeeks * 7), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </PrimaryOffCanvas>

      {/* Edit Series Side Panel */}
      <PrimaryOffCanvas
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Recurring Series"
        description={`Modify ${selectedSeries?.staffName}'s shift schedule`}
        icon={Edit}
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowEditModal(false), variant: 'outlined' },
          { 
            label: 'Save Changes', 
            onClick: handleSaveEdit, 
            variant: 'primary',
            icon: <CheckCircle2 className="h-4 w-4" />
          },
        ]}
      >
        <div className="space-y-6">
          {/* Series Summary */}
          <div className="bg-background rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedSeries?.staffName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSeries?.remainingShifts} upcoming shifts
                </p>
              </div>
            </div>
          </div>

          {/* Shift Times */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-primary">Shift Times</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Start Time</label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">End Time</label>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Effective From Date */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-primary">Changes Effective From</label>
            <div className="space-y-2">
              <input
                type="date"
                value={editEffectiveDate}
                min={today}
                onChange={(e) => setEditEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditEffectiveDate(today)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                    editEffectiveDate === today
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  )}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setEditEffectiveDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                    editEffectiveDate === format(addDays(new Date(), 7), 'yyyy-MM-dd')
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  )}
                >
                  Next Week
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Next month
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    nextMonth.setDate(1);
                    setEditEffectiveDate(format(nextMonth, 'yyyy-MM-dd'));
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors border bg-background border-border hover:bg-muted"
                >
                  Next Month
                </button>
              </div>
            </div>
            {editEffectiveDate && editEffectiveDate !== today && (
              <p className="text-xs text-muted-foreground">
                Changes will apply to shifts on or after {format(parseISO(editEffectiveDate), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Days of Week */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-primary">Days of Week</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleEditDay(day.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    editDaysOfWeek.includes(day.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Room/Location */}
          <div className="bg-muted/30 rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Location</span>
            </div>
            <p className="text-sm text-foreground">
              {selectedSeries ? getRoomName(selectedSeries.centreId, selectedSeries.roomId) : 'Unknown'}
            </p>
          </div>

          {/* Info Note */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p>
                  <strong>Effective from:</strong> {!editEffectiveDate || editEffectiveDate === today 
                    ? 'Today' 
                    : format(parseISO(editEffectiveDate), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="mt-1">
                  Changes will apply to shifts on or after this date. Earlier shifts will remain unchanged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PrimaryOffCanvas>
    </>
  );
}

export default RecurringShiftManagementPanel;
