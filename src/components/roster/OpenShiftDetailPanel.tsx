import { OpenShift, StaffMember, Centre, qualificationLabels, shiftTypeLabels } from '@/types/roster';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Building2, 
  Trash2,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OpenShiftDetailPanelProps {
  openShift: OpenShift;
  staff: StaffMember[];
  centre: Centre;
  onClose: () => void;
  onSave: (openShift: OpenShift) => void;
  onDelete: (openShiftId: string) => void;
  onFill: (openShift: OpenShift, staffId: string) => void;
  onSendToAgency?: (openShift: OpenShift) => void;
}

export function OpenShiftDetailPanel({
  openShift,
  staff,
  centre,
  onClose,
  onSave,
  onDelete,
  onFill,
  onSendToAgency,
}: OpenShiftDetailPanelProps) {
  const [editedShift, setEditedShift] = useState<OpenShift>(openShift);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  useEffect(() => {
    setEditedShift(openShift);
    setSelectedStaffId('');
  }, [openShift]);

  const room = centre.rooms.find(r => r.id === editedShift.roomId);

  const urgencyColors = {
    low: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
    medium: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300',
    critical: 'text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-300',
  };

  const handleSave = () => {
    onSave(editedShift);
    onClose();
  };

  const handleFill = () => {
    if (selectedStaffId) {
      onFill(editedShift, selectedStaffId);
      onClose();
    }
  };

  // Filter staff who meet qualifications
  const eligibleStaff = staff.filter(s => {
    const hasQualifications = editedShift.requiredQualifications.every(
      req => s.qualifications.some(q => q.type === req)
    );
    return hasQualifications;
  });

  const calculateDuration = (start: string, end: string, breakMins: number = 0): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let minutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (minutes < 0) minutes += 24 * 60;
    return (minutes - breakMins) / 60;
  };

  const duration = calculateDuration(editedShift.startTime, editedShift.endTime, editedShift.breakMinutes || 0);

  return (
    <PrimaryOffCanvas
      open={true}
      onClose={onClose}
      title="Open Shift Details"
      description={`${room?.name || 'Unknown Room'} - ${format(new Date(editedShift.date), 'EEE, MMM d')}`}
      icon={AlertCircle}
      size="lg"
      showFooter={true}
      actions={[
        {
          label: 'Delete',
          variant: 'destructive',
          onClick: () => {
            onDelete(editedShift.id);
            onClose();
          },
        },
        {
          label: 'Cancel',
          variant: 'outlined',
          onClick: onClose,
        },
        {
          label: 'Save Changes',
          variant: 'primary',
          onClick: handleSave,
        },
      ]}
      headerActions={
        onSendToAgency && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendToAgency(editedShift)}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Send to Agency
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Urgency Badge */}
        <div className="flex items-center gap-2">
          <Badge className={cn("capitalize text-sm px-3 py-1", urgencyColors[editedShift.urgency])}>
            {editedShift.urgency === 'critical' && <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
            {editedShift.urgency} Priority
          </Badge>
          {editedShift.shiftType && editedShift.shiftType !== 'regular' && (
            <Badge variant="outline" className="text-sm">
              {shiftTypeLabels[editedShift.shiftType]}
            </Badge>
          )}
        </div>

        {/* Assign Staff Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4 text-primary" />
            Fill This Shift
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select staff member..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleStaff.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No eligible staff found
                  </div>
                ) : (
                  eligibleStaff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                        <span className="text-muted-foreground text-xs">
                          ({s.role.replace('_', ' ')})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleFill} 
              disabled={!selectedStaffId}
            >
              Assign
            </Button>
          </div>
          
          {eligibleStaff.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {eligibleStaff.length} staff member{eligibleStaff.length !== 1 ? 's' : ''} meet the qualifications
            </p>
          )}
        </div>

        {/* Time Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shift Time
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={editedShift.startTime}
                onChange={(e) => setEditedShift(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                value={editedShift.endTime}
                onChange={(e) => setEditedShift(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Duration: {duration.toFixed(1)} hours</span>
            {editedShift.breakMinutes && editedShift.breakMinutes > 0 && (
              <span>• {editedShift.breakMinutes}min break</span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={editedShift.date}
                onChange={(e) => setEditedShift(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Room</Label>
              <Select 
                value={editedShift.roomId} 
                onValueChange={(value) => setEditedShift(prev => ({ ...prev, roomId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {centre.rooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Urgency Level
          </h4>
          <Select 
            value={editedShift.urgency} 
            onValueChange={(value: OpenShift['urgency']) => setEditedShift(prev => ({ ...prev, urgency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low - Plenty of time</SelectItem>
              <SelectItem value="medium">Medium - Should be filled soon</SelectItem>
              <SelectItem value="high">High - Needs attention</SelectItem>
              <SelectItem value="critical">Critical - Immediate action</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Required Qualifications */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Required Qualifications
          </h4>
          <div className="flex flex-wrap gap-2">
            {editedShift.requiredQualifications.length > 0 ? (
              editedShift.requiredQualifications.map(qual => (
                <Badge key={qual} variant="secondary">
                  {qualificationLabels[qual]}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No specific qualifications required</span>
            )}
          </div>
        </div>

        {/* Applicants */}
        {editedShift.applicants && editedShift.applicants.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              Applicants ({editedShift.applicants.length})
            </h4>
            <div className="space-y-2">
              {editedShift.applicants.map(applicantId => {
                const applicant = staff.find(s => s.id === applicantId);
                return applicant ? (
                  <div key={applicantId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: applicant.color }}
                      >
                        {applicant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm">{applicant.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onFill(editedShift, applicantId);
                        onClose();
                      }}
                    >
                      Accept
                    </Button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-3">
          <Label>Notes</Label>
          <Textarea
            placeholder="Add notes about this open shift..."
            value={editedShift.notes || ''}
            onChange={(e) => setEditedShift(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
