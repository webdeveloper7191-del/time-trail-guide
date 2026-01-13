import { useState, useMemo } from 'react';
import { Shift, StaffMember, DemandData, RosterComplianceFlag, Room, Centre } from '@/types/roster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  MapPin,
  Coffee,
  Save,
  Trash2,
  Copy,
  ArrowLeftRight,
  Zap,
  Phone,
  Moon,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { DemandHistogram } from './DemandHistogram';
import { ShiftTypeEditor } from './ShiftTypeEditor';
import { AllowanceEligibilityPanel } from './AllowanceEligibilityPanel';

interface ShiftDetailPanelProps {
  shift: Shift;
  staff: StaffMember[];
  centre: Centre;
  demandData: DemandData[];
  complianceFlags: RosterComplianceFlag[];
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
  onDuplicate: (shift: Shift) => void;
  onSwapStaff: (shift: Shift) => void;
  onCopyShift?: (shift: Shift) => void;
}

export function ShiftDetailPanel({
  shift,
  staff,
  centre,
  demandData,
  complianceFlags,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onSwapStaff,
  onCopyShift,
}: ShiftDetailPanelProps) {
  const [editedShift, setEditedShift] = useState<Shift>(shift);
  
  const assignedStaff = staff.find(s => s.id === editedShift.staffId);
  const room = centre.rooms.find(r => r.id === shift.roomId);
  
  const relatedFlags = complianceFlags.filter(
    f => f.date === shift.date && 
         f.roomId === shift.roomId && 
         f.centreId === shift.centreId
  );

  const shiftDuration = useMemo(() => {
    const [startH, startM] = editedShift.startTime.split(':').map(Number);
    const [endH, endM] = editedShift.endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - editedShift.breakMinutes;
    return Math.round(totalMinutes / 60 * 10) / 10;
  }, [editedShift]);

  const estimatedCost = assignedStaff 
    ? Math.round(shiftDuration * assignedStaff.hourlyRate * 100) / 100
    : 0;

  const handleSave = () => {
    onSave(editedShift);
    onClose();
  };

  // Get shift type icon and color
  const getShiftTypeIndicator = () => {
    switch (editedShift.shiftType) {
      case 'on_call':
        return { icon: Phone, color: 'text-blue-600', label: 'On-Call' };
      case 'sleepover':
        return { icon: Moon, color: 'text-purple-600', label: 'Sleepover' };
      case 'broken':
        return { icon: Clock, color: 'text-orange-600', label: 'Broken Shift' };
      case 'recall':
        return { icon: Phone, color: 'text-red-600', label: 'Recall' };
      case 'emergency':
        return { icon: AlertTriangle, color: 'text-destructive', label: 'Emergency' };
      default:
        return null;
    }
  };

  const shiftTypeIndicator = getShiftTypeIndicator();

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Shift Details</h2>
            {shiftTypeIndicator && (
              <Badge variant="outline" className={cn("flex items-center gap-1", shiftTypeIndicator.color)}>
                <shiftTypeIndicator.icon className="h-3 w-3" />
                {shiftTypeIndicator.label}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(parseISO(shift.date), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <MapPin className="h-4 w-4" />
          <span>{centre.name} • {room?.name}</span>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="allowances" className="text-xs flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Allowances
            </TabsTrigger>
            <TabsTrigger value="demand" className="text-xs flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Demand
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Risk/Compliance Alerts */}
              {relatedFlags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Risk Impacts
                  </Label>
                  <div className="space-y-2">
                    {relatedFlags.map(flag => (
                      <div
                        key={flag.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          flag.severity === 'critical' && "border-destructive/50 bg-destructive/10",
                          flag.severity === 'warning' && "border-amber-500/50 bg-amber-500/10",
                          flag.severity === 'info' && "border-blue-500/50 bg-blue-500/10"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={cn(
                            "h-4 w-4 mt-0.5",
                            flag.severity === 'critical' && "text-destructive",
                            flag.severity === 'warning' && "text-amber-500",
                            flag.severity === 'info' && "text-blue-500"
                          )} />
                          <div>
                            <p className="text-sm font-medium">{flag.message}</p>
                            {flag.timeSlot && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Time: {flag.timeSlot}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff Assignment */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Staff Assignment
                </Label>
                <Select 
                  value={editedShift.staffId} 
                  onValueChange={(value) => setEditedShift(prev => ({ ...prev, staffId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(member => (
                      <SelectItem key={member.id} value={member.id} textValue={member.name}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: member.color }}
                          />
                          <span>{member.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({member.currentWeeklyHours}/{member.maxHoursPerWeek}h)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {assignedStaff && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: assignedStaff.color }}
                      >
                        {assignedStaff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{assignedStaff.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${assignedStaff.hourlyRate.toFixed(2)}/hr
                        </p>
                      </div>
                    </div>
                    
                    {/* Overtime warning */}
                    {assignedStaff.currentWeeklyHours + shiftDuration > assignedStaff.maxHoursPerWeek && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>This shift would exceed weekly hour limit</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Time Settings */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Schedule
                </Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="startTime" className="text-sm">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={editedShift.startTime}
                      onChange={(e) => setEditedShift(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={editedShift.endTime}
                      onChange={(e) => setEditedShift(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="break" className="text-sm flex items-center gap-1">
                    <Coffee className="h-3.5 w-3.5" />
                    Break Duration
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="break"
                      type="number"
                      min={0}
                      step={15}
                      value={editedShift.breakMinutes}
                      onChange={(e) => setEditedShift(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>

                {/* Duration & Cost Summary */}
                <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">{shiftDuration} hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Cost</p>
                      <p className="text-sm font-medium">${estimatedCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Room Assignment */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Room
                </Label>
                <Select 
                  value={editedShift.roomId} 
                  onValueChange={(value) => setEditedShift(prev => ({ ...prev, roomId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {centre.rooms.map(r => (
                      <SelectItem key={r.id} value={r.id} textValue={r.name}>
                        {r.name} (1:{r.requiredRatio} ratio)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={editedShift.notes || ''}
                  onChange={(e) => setEditedShift(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes for this shift..."
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Status</Label>
                <Badge variant={editedShift.status === 'draft' ? 'outline' : 'default'}>
                  {editedShift.status}
                </Badge>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Allowances Tab */}
        <TabsContent value="allowances" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Shift Type Editor */}
              <ShiftTypeEditor 
                shift={editedShift}
                onChange={setEditedShift}
              />

              <Separator />

              {/* Allowance Eligibility */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Allowance Eligibility
                </Label>
                <AllowanceEligibilityPanel 
                  shift={editedShift}
                  staff={assignedStaff}
                />
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Demand Tab */}
        <TabsContent value="demand" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {room && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Demand Context
                  </Label>
                  <DemandHistogram 
                    demandData={demandData}
                    room={room}
                    date={shift.date}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Actions Footer */}
      <div className="p-4 border-t border-border bg-muted/30 space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onSwapStaff(shift)}>
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            Swap
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onCopyShift?.(shift)}>
            <Copy className="h-4 w-4 mr-1" />
            Copy to...
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDuplicate(shift)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(shift.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Button className="w-full" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
