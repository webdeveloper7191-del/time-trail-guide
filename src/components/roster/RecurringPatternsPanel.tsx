import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
 import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import {
  Repeat,
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import {
  RecurringShiftPattern,
  RecurrencePattern,
  GeneratedShift,
  recurrencePatternLabels,
} from '@/types/advancedRoster';
import { Shift, StaffMember, Room, Centre } from '@/types/roster';
import { generateShiftsFromPattern, generateBulkShiftsFromPatterns, convertGeneratedShiftsToRosterShifts } from '@/lib/shiftGenerator';
import { useRecurringPatterns } from '@/hooks/useRecurringPatterns';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const mockRoles = [
  { id: 'educator', name: 'Educator' },
  { id: 'support', name: 'Support Worker' },
  { id: 'lead', name: 'Lead Educator' },
  { id: 'admin', name: 'Administration' },
  { id: 'cleaning', name: 'Cleaner' },
];

interface RecurringPatternsPanelProps {
  centreId?: string;
  centre?: Centre;
  staff?: StaffMember[];
  existingShifts?: Shift[];
  onGenerateShifts?: (shifts: Omit<Shift, 'id'>[]) => void;
}

export function RecurringPatternsPanel({ 
  centreId = 'centre-1',
  centre,
  staff = [],
  existingShifts = [],
  onGenerateShifts,
}: RecurringPatternsPanelProps) {
  // Use shared patterns hook for state management
  const { patterns, addPattern, updatePattern, deletePattern, togglePatternActive } = useRecurringPatterns();
  
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<RecurringShiftPattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeksToGenerate, setWeeksToGenerate] = useState(4);
  const [lastGeneratedCount, setLastGeneratedCount] = useState(0);

  // Form state
  const [newPattern, setNewPattern] = useState<Partial<RecurringShiftPattern>>({
    name: '',
    pattern: 'weekly',
    daysOfWeek: [],
    shiftTemplate: {
      startTime: '09:00',
      endTime: '17:00',
      roleId: '',
      roleName: '',
      centreId: '',
      breakDuration: 30,
    },
    isActive: true,
  });

  const handleToggleDay = (day: number) => {
    const current = newPattern.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    setNewPattern(prev => ({ ...prev, daysOfWeek: updated }));
  };

  const handleCreatePattern = () => {
    const pattern: RecurringShiftPattern = {
      id: `pattern-${Date.now()}`,
      name: newPattern.name || 'New Pattern',
      description: newPattern.description,
      pattern: newPattern.pattern as RecurrencePattern,
      startDate: newPattern.startDate || new Date().toISOString().split('T')[0],
      endDate: newPattern.endDate,
      daysOfWeek: newPattern.daysOfWeek,
      weekInterval: newPattern.weekInterval,
      shiftTemplate: newPattern.shiftTemplate!,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };

    addPattern(pattern);
    setShowCreatePanel(false);
    setNewPattern({
      name: '',
      pattern: 'weekly',
      daysOfWeek: [],
      shiftTemplate: {
        startTime: '09:00',
        endTime: '17:00',
        roleId: '',
        roleName: '',
        centreId: '',
        breakDuration: 30,
      },
      isActive: true,
    });
    toast.success('Pattern created successfully');
  };

  const handleToggleActive = (patternId: string) => {
    togglePatternActive(patternId);
    toast.success('Pattern status updated');
  };

  const handleDeletePattern = (patternId: string) => {
    deletePattern(patternId);
    toast.success('Pattern deleted');
  };

  const handleGenerateShifts = async (patternId: string, weeks: number = weeksToGenerate) => {
    setIsGenerating(true);
    
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) {
      setIsGenerating(false);
      return;
    }
    
    const defaultRoomId = centre?.rooms?.[0]?.id || 'room-1';
    const generated = generateShiftsFromPattern(pattern, new Date(), weeks, existingShifts);
    const shifts = convertGeneratedShiftsToRosterShifts(generated, defaultRoomId);
    
    if (onGenerateShifts && shifts.length > 0) {
      onGenerateShifts(shifts);
      setLastGeneratedCount(shifts.length);
      toast.success(`Generated ${shifts.length} shifts from "${pattern.name}"`, {
        description: 'Shifts have been added to the roster as drafts',
      });
    } else if (shifts.length === 0) {
      toast.info('No new shifts to generate', {
        description: 'All shifts for this period already exist',
      });
    } else {
      // Demo mode - no callback provided
      toast.success(`Would generate ${shifts.length} shifts`, {
        description: 'Connect the panel to enable real generation',
      });
    }
    
    setIsGenerating(false);
  };

  const handleBulkGenerate = async () => {
    setIsGenerating(true);
    
    const defaultRoomId = centre?.rooms?.[0]?.id || 'room-1';
    const { shifts, summary } = generateBulkShiftsFromPatterns(
      patterns,
      new Date(),
      weeksToGenerate,
      existingShifts,
      defaultRoomId
    );
    
    if (onGenerateShifts && shifts.length > 0) {
      onGenerateShifts(shifts);
      setLastGeneratedCount(shifts.length);
      toast.success(`Bulk generation complete - ${shifts.length} shifts created`, {
        description: `From ${summary.filter(s => s.count > 0).length} active patterns`,
      });
    } else if (shifts.length === 0) {
      toast.info('No new shifts to generate');
    } else {
      toast.success(`Would generate ${shifts.length} shifts`, {
        description: 'Connect the panel to enable real generation',
      });
    }
    
    setIsGenerating(false);
  };

  const getDaysLabel = (days: number[] | undefined) => {
    if (!days || days.length === 0) return 'No days';
    if (days.length === 7) return 'Every day';
    if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays';
    if (JSON.stringify(days) === JSON.stringify([0, 6])) return 'Weekends';
    return days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label).join(', ');
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Repeat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Recurring Shift Patterns</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Define repeating schedules that auto-generate shifts
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBulkGenerate}
                disabled={isGenerating}
                className="border-border"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Generate All (4 weeks)
              </Button>
              <Button onClick={() => setShowCreatePanel(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Pattern
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{patterns.length}</p>
                <p className="text-sm text-muted-foreground">Total Patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{patterns.filter(p => p.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">~120</p>
                <p className="text-sm text-muted-foreground">Shifts/Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{patterns.filter(p => p.assignedStaffId).length}</p>
                <p className="text-sm text-muted-foreground">With Staff Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patterns List */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">Active Patterns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-medium text-muted-foreground">Pattern Name</TableHead>
                <TableHead className="font-medium text-muted-foreground">Recurrence</TableHead>
                <TableHead className="font-medium text-muted-foreground">Shift Time</TableHead>
                <TableHead className="font-medium text-muted-foreground">Role</TableHead>
                <TableHead className="font-medium text-muted-foreground">Assigned To</TableHead>
                <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns.map(pattern => (
                <TableRow key={pattern.id} className="border-b border-border hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{pattern.name}</p>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="border-border text-foreground">{recurrencePatternLabels[pattern.pattern]}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getDaysLabel(pattern.daysOfWeek)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm text-foreground">
                        {pattern.shiftTemplate.startTime} - {pattern.shiftTemplate.endTime}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-secondary text-secondary-foreground border-0">{pattern.shiftTemplate.roleName}</Badge>
                  </TableCell>
                  <TableCell>
                    {pattern.assignedStaffName ? (
                      <span className="text-foreground">{pattern.assignedStaffName}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StyledSwitch
                        checked={pattern.isActive}
                        onChange={() => handleToggleActive(pattern.id)}
                        size="small"
                      />
                      <span className={pattern.isActive ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        {pattern.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleGenerateShifts(pattern.id)}
                        disabled={isGenerating}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPattern(pattern)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePattern(pattern.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Pattern Sheet - Using PrimaryOffCanvas */}
      <PrimaryOffCanvas
        open={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title="Create Recurring Pattern"
        description="Define a repeating shift schedule"
        icon={Repeat}
        size="md"
        actions={[
          {
            label: 'Cancel',
            variant: 'outlined',
            onClick: () => setShowCreatePanel(false),
          },
          {
            label: 'Create Pattern',
            variant: 'primary',
            onClick: handleCreatePattern,
          },
        ]}
      >
         <FormSection title="Pattern Details">
           <FormField label="Pattern Name" required>
            <Input
              placeholder="e.g., Morning Educator Shift"
              value={newPattern.name}
              onChange={e => setNewPattern(prev => ({ ...prev, name: e.target.value }))}
            />
           </FormField>

           <FormField label="Recurrence Type" required>
            <Select
              value={newPattern.pattern}
              onValueChange={v => setNewPattern(prev => ({ ...prev, pattern: v as RecurrencePattern }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
           </FormField>

           <FormField label="Days of Week" required>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map(day => (
                <div
                  key={day.value}
                  className={`px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    newPattern.daysOfWeek?.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => handleToggleDay(day.value)}
                >
                  {day.label}
                </div>
              ))}
            </div>
           </FormField>
         </FormSection>

         <FormSection title="Shift Schedule">
           <FormRow columns={2}>
             <FormField label="Start Time" required>
              <Input
                type="time"
                value={newPattern.shiftTemplate?.startTime}
                onChange={e =>
                  setNewPattern(prev => ({
                    ...prev,
                    shiftTemplate: { ...prev.shiftTemplate!, startTime: e.target.value },
                  }))
                }
              />
             </FormField>
             <FormField label="End Time" required>
              <Input
                type="time"
                value={newPattern.shiftTemplate?.endTime}
                onChange={e =>
                  setNewPattern(prev => ({
                    ...prev,
                    shiftTemplate: { ...prev.shiftTemplate!, endTime: e.target.value },
                  }))
                }
              />
             </FormField>
           </FormRow>

           <FormField label="Role" required>
            <Select
              value={newPattern.shiftTemplate?.roleId}
              onValueChange={v => {
                const role = mockRoles.find(r => r.id === v);
                setNewPattern(prev => ({
                  ...prev,
                  shiftTemplate: {
                    ...prev.shiftTemplate!,
                    roleId: v,
                    roleName: role?.name || '',
                  },
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {mockRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
           </FormField>

           <FormField label="Centre" required>
            <Select
              value={newPattern.shiftTemplate?.centreId}
              onValueChange={v =>
                setNewPattern(prev => ({
                  ...prev,
                  shiftTemplate: { ...prev.shiftTemplate!, centreId: v },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select centre" />
              </SelectTrigger>
              <SelectContent>
                {centre ? (
                  <SelectItem value={centre.id}>{centre.name}</SelectItem>
                ) : (
                  <>
                    <SelectItem value="centre-1">Sydney CBD Centre</SelectItem>
                    <SelectItem value="centre-2">Melbourne Central</SelectItem>
                    <SelectItem value="centre-3">Brisbane North</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
           </FormField>
         </FormSection>

         <FormSection title="Pattern Duration">
           <FormRow columns={2}>
             <FormField label="Start Date">
              <Input
                type="date"
                value={newPattern.startDate}
                onChange={e => setNewPattern(prev => ({ ...prev, startDate: e.target.value }))}
              />
             </FormField>
             <FormField label="End Date (optional)">
              <Input
                type="date"
                value={newPattern.endDate}
                onChange={e => setNewPattern(prev => ({ ...prev, endDate: e.target.value }))}
              />
             </FormField>
           </FormRow>
         </FormSection>
      </PrimaryOffCanvas>

      {/* Edit Pattern Sheet - Using PrimaryOffCanvas */}
      <PrimaryOffCanvas
        open={!!selectedPattern}
        onClose={() => setSelectedPattern(null)}
        title="Edit Recurring Pattern"
        description={selectedPattern?.name || 'Modify pattern settings'}
        icon={Edit}
        size="md"
        actions={[
          {
            label: 'Cancel',
            variant: 'outlined',
            onClick: () => setSelectedPattern(null),
          },
          {
            label: 'Save Changes',
            variant: 'primary',
            onClick: () => {
              if (selectedPattern) {
                updatePattern(selectedPattern.id, selectedPattern);
                toast.success('Pattern updated successfully');
                setSelectedPattern(null);
              }
            },
          },
        ]}
      >
        {selectedPattern && (
           <>
           <FormSection title="Pattern Details">
             <FormField label="Pattern Name" required>
              <Input
                placeholder="e.g., Morning Educator Shift"
                value={selectedPattern.name}
                onChange={e => setSelectedPattern({ ...selectedPattern, name: e.target.value })}
              />
             </FormField>

             <FormField label="Description">
              <Input
                placeholder="Optional description"
                value={selectedPattern.description || ''}
                onChange={e => setSelectedPattern({ ...selectedPattern, description: e.target.value })}
              />
             </FormField>

             <FormField label="Recurrence Type" required>
              <Select
                value={selectedPattern.pattern}
                onValueChange={v => setSelectedPattern({ ...selectedPattern, pattern: v as RecurrencePattern })}
              >
                 <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
             </FormField>

             <FormField label="Days of Week" required>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map(day => (
                  <div
                    key={day.value}
                    className={`px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedPattern.daysOfWeek?.includes(day.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                    onClick={() => {
                      const current = selectedPattern.daysOfWeek || [];
                      const updated = current.includes(day.value)
                        ? current.filter(d => d !== day.value)
                        : [...current, day.value].sort((a, b) => a - b);
                      setSelectedPattern({ ...selectedPattern, daysOfWeek: updated });
                    }}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
             </FormField>
           </FormSection>

           <FormSection title="Shift Schedule">
             <FormRow columns={2}>
               <FormField label="Start Time" required>
                <Input
                  type="time"
                  value={selectedPattern.shiftTemplate?.startTime}
                  onChange={e =>
                    setSelectedPattern({
                      ...selectedPattern,
                      shiftTemplate: { ...selectedPattern.shiftTemplate, startTime: e.target.value },
                    })
                  }
                />
               </FormField>
               <FormField label="End Time" required>
                <Input
                  type="time"
                  value={selectedPattern.shiftTemplate?.endTime}
                  onChange={e =>
                    setSelectedPattern({
                      ...selectedPattern,
                      shiftTemplate: { ...selectedPattern.shiftTemplate, endTime: e.target.value },
                    })
                  }
                />
               </FormField>
             </FormRow>

             <FormField label="Role" required>
              <Select
                value={selectedPattern.shiftTemplate?.roleId}
                onValueChange={v => {
                  const role = mockRoles.find(r => r.id === v);
                  setSelectedPattern({
                    ...selectedPattern,
                    shiftTemplate: {
                      ...selectedPattern.shiftTemplate,
                      roleId: v,
                      roleName: role?.name || '',
                    },
                  });
                }}
              >
                 <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {mockRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
             </FormField>
           </FormSection>

           <FormSection title="Pattern Duration">
             <FormRow columns={2}>
               <FormField label="Start Date">
                <Input
                  type="date"
                  value={selectedPattern.startDate}
                  onChange={e => setSelectedPattern({ ...selectedPattern, startDate: e.target.value })}
                />
               </FormField>
               <FormField label="End Date (optional)">
                <Input
                  type="date"
                  value={selectedPattern.endDate || ''}
                  onChange={e => setSelectedPattern({ ...selectedPattern, endDate: e.target.value })}
                />
               </FormField>
             </FormRow>
           </FormSection>

           <FormSection title="Status">
             <div className="flex items-center gap-3">
                <StyledSwitch
                  checked={selectedPattern.isActive}
                  onChange={(checked) => setSelectedPattern({ ...selectedPattern, isActive: checked })}
                />
                <span className={selectedPattern.isActive ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {selectedPattern.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
           </FormSection>
           </>
        )}
      </PrimaryOffCanvas>
    </div>
  );
}
