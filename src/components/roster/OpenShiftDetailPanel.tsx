import { OpenShift, StaffMember, Centre, qualificationLabels, shiftTypeLabels } from '@/types/roster';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow, FormQuestionLabel } from '@/components/ui/off-canvas/FormSection';
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
          variant: 'secondary',
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

        {/* Who should fill this shift? */}
        <div className="space-y-3">
          <FormQuestionLabel question="Who should fill this shift?" required />
          <FormField label="Select Staff" required tooltip="Choose from eligible staff members">
            <div className="flex gap-2">
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="flex-1 bg-background border-border h-11">
                  <SelectValue placeholder="Select staff" />
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          </FormField>
          {eligibleStaff.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {eligibleStaff.length} staff member{eligibleStaff.length !== 1 ? 's' : ''} meet the qualifications
            </p>
          )}
        </div>

        {/* When is this shift? */}
        <div className="space-y-3">
          <FormQuestionLabel question="When is this shift?" required />
          <FormRow columns={2}>
            <FormField label="Date" required>
              <Input
                type="date"
                value={editedShift.date}
                onChange={(e) => setEditedShift(prev => ({ ...prev, date: e.target.value }))}
                className="bg-background border-border h-11"
              />
            </FormField>
            <FormField label="Room" required tooltip="Select the room for this shift">
              <Select 
                value={editedShift.roomId} 
                onValueChange={(value) => setEditedShift(prev => ({ ...prev, roomId: value }))}
              >
                <SelectTrigger className="bg-background border-border h-11">
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
        </div>

        {/* Shift Time */}
        <div className="space-y-3">
          <FormQuestionLabel question="Shift Time" required />
          <FormRow columns={2}>
            <FormField label="Start Time" required>
              <Input
                type="time"
                value={editedShift.startTime}
                onChange={(e) => setEditedShift(prev => ({ ...prev, startTime: e.target.value }))}
                className="bg-background border-border h-11"
              />
            </FormField>
            <FormField label="End Time" required>
              <Input
                type="time"
                value={editedShift.endTime}
                onChange={(e) => setEditedShift(prev => ({ ...prev, endTime: e.target.value }))}
                className="bg-background border-border h-11"
              />
            </FormField>
          </FormRow>
          
          {/* Duration chip like reference */}
          <div className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-full text-sm">
            <span className="text-foreground">
              This shift is <span className="font-medium">{duration.toFixed(1)}hrs</span>
              {editedShift.breakMinutes && editedShift.breakMinutes > 0 && (
                <> with {editedShift.breakMinutes}min break</>
              )}
            </span>
          </div>
        </div>

        {/* Is this shift urgent? */}
        <div className="space-y-3">
          <FormQuestionLabel question="Is this shift urgent?" />
          <RadioGroup
            value={editedShift.urgency}
            onValueChange={(value: OpenShift['urgency']) => 
              setEditedShift(prev => ({ ...prev, urgency: value }))
            }
            className="space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="low" id="urgency-low" className="border-primary text-primary" />
              <Label htmlFor="urgency-low" className="cursor-pointer text-foreground">Low</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="medium" id="urgency-medium" className="border-primary text-primary" />
              <Label htmlFor="urgency-medium" className="cursor-pointer text-foreground">Medium</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="high" id="urgency-high" className="border-primary text-primary" />
              <Label htmlFor="urgency-high" className="cursor-pointer text-foreground">High</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="critical" id="urgency-critical" className="border-primary text-primary" />
              <Label htmlFor="urgency-critical" className="cursor-pointer text-destructive">Critical</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Required Qualifications */}
        <FormSection title="Required Qualifications" tooltip="Qualifications needed to fill this shift">
          <div className="flex flex-wrap gap-2">
            {editedShift.requiredQualifications.length > 0 ? (
              editedShift.requiredQualifications.map(qual => (
                <Badge key={qual} variant="secondary" className="text-sm bg-background border border-border">
                  {qualificationLabels[qual]}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No specific qualifications required</span>
            )}
          </div>
        </FormSection>

        {/* Applicants Table-like Display */}
        {editedShift.applicants && editedShift.applicants.length > 0 && (
          <FormSection title={`Applicants (${editedShift.applicants.length})`} tooltip="Staff who have expressed interest">
            <div className="bg-background border border-border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-muted/50 px-4 py-2 border-b border-border grid grid-cols-[1fr_auto] gap-4">
                <span className="text-sm font-medium text-muted-foreground">Staff Member</span>
                <span className="text-sm font-medium text-muted-foreground">Action</span>
              </div>
              {/* Table Rows */}
              <div className="divide-y divide-border">
                {editedShift.applicants.map(applicantId => {
                  const applicant = staff.find(s => s.id === applicantId);
                  return applicant ? (
                    <div 
                      key={applicantId} 
                      className="px-4 py-3 grid grid-cols-[1fr_auto] gap-4 items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: applicant.color }}
                        >
                          {applicant.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{applicant.name}</span>
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
                        className="text-primary border-primary hover:bg-primary/10"
                      >
                        Accept
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </FormSection>
        )}

        {/* Reason for this shift */}
        <div className="space-y-3">
          <FormQuestionLabel question="Reason for this shift" required />
          <Textarea
            placeholder="Enter Reason"
            value={editedShift.notes || ''}
            onChange={(e) => setEditedShift(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="resize-none bg-background border-border"
          />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
