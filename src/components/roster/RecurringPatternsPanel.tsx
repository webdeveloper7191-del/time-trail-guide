import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

// Mock data for initial patterns
const mockPatterns: RecurringShiftPattern[] = [
  {
    id: 'pattern-1',
    name: 'Morning Educator Shift',
    description: 'Standard morning shift for qualified educators',
    pattern: 'weekly',
    startDate: '2025-01-06',
    endDate: '2025-06-30',
    daysOfWeek: [1, 2, 3, 4, 5],
    shiftTemplate: {
      startTime: '07:00',
      endTime: '15:00',
      roleId: 'educator',
      roleName: 'Educator',
      centreId: 'centre-1',
      requiredQualifications: ['Cert III', 'First Aid'],
      breakDuration: 30,
    },
    assignedStaffId: 'staff-1',
    assignedStaffName: 'Sarah Johnson',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'pattern-2',
    name: 'Weekend Support Worker',
    description: 'Weekend coverage for support staff',
    pattern: 'weekly',
    startDate: '2025-01-04',
    daysOfWeek: [0, 6],
    shiftTemplate: {
      startTime: '08:00',
      endTime: '16:00',
      roleId: 'support',
      roleName: 'Support Worker',
      centreId: 'centre-1',
      breakDuration: 30,
    },
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'pattern-3',
    name: 'Fortnightly Deep Clean',
    description: 'Deep cleaning shift every second Friday',
    pattern: 'fortnightly',
    startDate: '2025-01-10',
    daysOfWeek: [5],
    weekInterval: 2,
    shiftTemplate: {
      startTime: '17:00',
      endTime: '21:00',
      roleId: 'cleaning',
      roleName: 'Cleaner',
      centreId: 'centre-1',
      breakDuration: 0,
    },
    isActive: false,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'admin',
  },
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
  const [patterns, setPatterns] = useState(mockPatterns);
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

    setPatterns(prev => [...prev, pattern]);
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
    setPatterns(prev =>
      prev.map(p => (p.id === patternId ? { ...p, isActive: !p.isActive } : p))
    );
    toast.success('Pattern status updated');
  };

  const handleDeletePattern = (patternId: string) => {
    setPatterns(prev => prev.filter(p => p.id !== patternId));
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
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Repeat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Recurring Shift Patterns</CardTitle>
                <CardDescription>
                  Define repeating schedules that auto-generate shifts
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBulkGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Generate All (4 weeks)
              </Button>
              <Button onClick={() => setShowCreatePanel(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Pattern
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patterns.length}</p>
                <p className="text-sm text-muted-foreground">Total Patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patterns.filter(p => p.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">~120</p>
                <p className="text-sm text-muted-foreground">Shifts/Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patterns.filter(p => p.assignedStaffId).length}</p>
                <p className="text-sm text-muted-foreground">With Staff Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patterns List */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Active Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pattern Name</TableHead>
                <TableHead>Recurrence</TableHead>
                <TableHead>Shift Time</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns.map(pattern => (
                <TableRow key={pattern.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pattern.name}</p>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline">{recurrencePatternLabels[pattern.pattern]}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getDaysLabel(pattern.daysOfWeek)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {pattern.shiftTemplate.startTime} - {pattern.shiftTemplate.endTime}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{pattern.shiftTemplate.roleName}</Badge>
                  </TableCell>
                  <TableCell>
                    {pattern.assignedStaffName || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pattern.isActive}
                        onCheckedChange={() => handleToggleActive(pattern.id)}
                      />
                      <span className={pattern.isActive ? 'text-emerald-600' : 'text-muted-foreground'}>
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
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPattern(pattern)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePattern(pattern.id)}
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
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Pattern Name *</Label>
            <Input
              placeholder="e.g., Morning Educator Shift"
              value={newPattern.name}
              onChange={e => setNewPattern(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Recurrence Type *</Label>
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
          </div>

          <div className="space-y-2">
            <Label>Days of Week *</Label>
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
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
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
            </div>
            <div className="space-y-2">
              <Label>End Time *</Label>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
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
          </div>

          <div className="space-y-2">
            <Label>Centre *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newPattern.startDate}
                onChange={e => setNewPattern(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date (optional)</Label>
              <Input
                type="date"
                value={newPattern.endDate}
                onChange={e => setNewPattern(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </PrimaryOffCanvas>
    </div>
  );
}
