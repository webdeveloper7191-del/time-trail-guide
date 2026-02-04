import { OpenShift, StaffMember, Centre, qualificationLabels, shiftTypeLabels } from '@/types/roster';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  Building2, 
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
      <div className="space-y-5">
        {/* Urgency & Type Badge Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            className={cn(
              "capitalize text-sm px-3 py-1",
              editedShift.urgency === 'critical' && "bg-destructive/10 text-destructive border-destructive/20",
              editedShift.urgency === 'high' && "bg-[hsl(var(--open-shift-bg))] text-[hsl(var(--open-shift))] border-[hsl(var(--open-shift))]/20",
              editedShift.urgency === 'medium' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
              editedShift.urgency === 'low' && "bg-muted text-muted-foreground"
            )}
          >
            {editedShift.urgency === 'critical' && <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
            {editedShift.urgency} Priority
          </Badge>
          {editedShift.shiftType && editedShift.shiftType !== 'regular' && (
            <Badge variant="outline" className="text-sm">
              {shiftTypeLabels[editedShift.shiftType]}
            </Badge>
          )}
        </div>

        {/* Fill Shift Section */}
        <FormSection 
          title="Fill This Shift" 
          tooltip="Assign an eligible staff member to this open shift"
        >
          <FormField label="Select Staff Member" required>
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
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          </FormField>
          {eligibleStaff.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {eligibleStaff.length} staff member{eligibleStaff.length !== 1 ? 's' : ''} meet the qualifications
            </p>
          )}
        </FormSection>

        {/* Shift Time Section */}
        <FormSection 
          title="Shift Time" 
          tooltip="Configure the start and end times for this shift"
        >
          <FormRow columns={2}>
            <FormField label="Start Time" required>
              <Input
                type="time"
                value={editedShift.startTime}
                onChange={(e) => setEditedShift(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </FormField>
            <FormField label="End Time" required>
              <Input
                type="time"
                value={editedShift.endTime}
                onChange={(e) => setEditedShift(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </FormField>
          </FormRow>
          
          <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
            <span className="font-medium text-foreground">Duration:</span>{' '}
            <span className="text-muted-foreground">
              {duration.toFixed(1)} hours
              {editedShift.breakMinutes && editedShift.breakMinutes > 0 && (
                <> • {editedShift.breakMinutes}min break</>
              )}
            </span>
          </div>
        </FormSection>

        {/* Location Section */}
        <FormSection 
          title="Location" 
          tooltip="Set the date and room for this shift"
        >
          <FormRow columns={2}>
            <FormField label="Date" required>
              <Input
                type="date"
                value={editedShift.date}
                onChange={(e) => setEditedShift(prev => ({ ...prev, date: e.target.value }))}
              />
            </FormField>
            <FormField label="Room" required>
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
            </FormField>
          </FormRow>
        </FormSection>

        {/* Urgency Level Section */}
        <FormSection 
          title="Urgency Level" 
          tooltip="Set the priority level for filling this shift"
        >
          <FormField label="Priority">
            <RadioGroup
              value={editedShift.urgency}
              onValueChange={(value: OpenShift['urgency']) => 
                setEditedShift(prev => ({ ...prev, urgency: value }))
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="low" id="urgency-low" />
                <Label htmlFor="urgency-low" className="cursor-pointer">Low - Plenty of time</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="medium" id="urgency-medium" />
                <Label htmlFor="urgency-medium" className="cursor-pointer">Medium - Should be filled soon</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="high" id="urgency-high" />
                <Label htmlFor="urgency-high" className="cursor-pointer">High - Needs attention</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="critical" id="urgency-critical" />
                <Label htmlFor="urgency-critical" className="cursor-pointer text-destructive">Critical - Immediate action</Label>
              </div>
            </RadioGroup>
          </FormField>
        </FormSection>

        {/* Required Qualifications Section */}
        <FormSection 
          title="Required Qualifications" 
          tooltip="Qualifications needed to fill this shift"
        >
          <div className="flex flex-wrap gap-2">
            {editedShift.requiredQualifications.length > 0 ? (
              editedShift.requiredQualifications.map(qual => (
                <Badge key={qual} variant="secondary" className="text-sm">
                  {qualificationLabels[qual]}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No specific qualifications required</span>
            )}
          </div>
        </FormSection>

        {/* Applicants Section */}
        {editedShift.applicants && editedShift.applicants.length > 0 && (
          <FormSection 
            title={`Applicants (${editedShift.applicants.length})`}
            tooltip="Staff who have expressed interest in this shift"
          >
            <div className="space-y-2">
              {editedShift.applicants.map(applicantId => {
                const applicant = staff.find(s => s.id === applicantId);
                return applicant ? (
                  <div 
                    key={applicantId} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: applicant.color }}
                      >
                        {applicant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{applicant.name}</span>
                        <p className="text-xs text-muted-foreground">{applicant.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onFill(editedShift, applicantId);
                        onClose();
                      }}
                      className="text-primary border-primary/50 hover:bg-primary/10"
                    >
                      Accept
                    </Button>
                  </div>
                ) : null;
              })}
            </div>
          </FormSection>
        )}

        {/* Notes Section */}
        <FormSection 
          title="Notes" 
          tooltip="Additional information about this open shift"
        >
          <FormField label="Shift Notes">
            <Textarea
              placeholder="Add notes about this open shift..."
              value={editedShift.notes || ''}
              onChange={(e) => setEditedShift(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </FormField>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
