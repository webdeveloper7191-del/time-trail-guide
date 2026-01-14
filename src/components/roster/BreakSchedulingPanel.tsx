import { useState } from 'react';
import {
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Coffee, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  CheckCircle2,
  Zap,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { BreakRule } from '@/types/advancedRoster';

interface LocalScheduledBreak {
  id: string;
  staffId: string;
  staffName: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  breakStart: string;
  breakEnd: string;
  breakType: 'meal' | 'rest' | 'paid' | 'unpaid';
  status: 'scheduled' | 'taken' | 'missed' | 'in-progress';
  autoScheduled: boolean;
}

interface BreakCoverage {
  timeSlot: string;
  staffOnBreak: number;
  staffWorking: number;
  minimumRequired: number;
  coverage: number;
}

// Extended break rule with UI properties
interface ExtendedBreakRule extends BreakRule {
  shiftDurationMax?: number;
  mustBeTakenBetween?: { start: string; end: string };
  minimumStaffDuringBreak?: number;
  staggerBreaks?: boolean;
  staggerIntervalMinutes?: number;
  isActive?: boolean;
}

// Mock break rules
const mockBreakRules: ExtendedBreakRule[] = [
  {
    id: 'rule-1',
    name: 'Standard Meal Break',
    minShiftDuration: 5,
    shiftDurationMax: 8,
    breakDuration: 30,
    isPaid: false,
    isMandatory: true,
    earliestBreakStart: 3,
    latestBreakEnd: 2,
    mustBeTakenBetween: { start: '11:00', end: '14:00' },
    minimumStaffDuringBreak: 2,
    staggerBreaks: true,
    staggerIntervalMinutes: 15,
    isActive: true,
  },
  {
    id: 'rule-2',
    name: 'Extended Shift Meal Break',
    minShiftDuration: 8,
    shiftDurationMax: 12,
    breakDuration: 45,
    isPaid: false,
    isMandatory: true,
    earliestBreakStart: 3,
    latestBreakEnd: 2,
    mustBeTakenBetween: { start: '11:00', end: '15:00' },
    minimumStaffDuringBreak: 2,
    staggerBreaks: true,
    staggerIntervalMinutes: 20,
    isActive: true,
  },
  {
    id: 'rule-3',
    name: 'Morning Rest Break',
    minShiftDuration: 4,
    shiftDurationMax: 12,
    breakDuration: 15,
    isPaid: true,
    isMandatory: false,
    earliestBreakStart: 2,
    latestBreakEnd: 1,
    mustBeTakenBetween: { start: '09:30', end: '11:00' },
    minimumStaffDuringBreak: 3,
    staggerBreaks: true,
    staggerIntervalMinutes: 10,
    isActive: true,
  },
];

// Mock scheduled breaks
const mockScheduledBreaks: LocalScheduledBreak[] = [
  {
    id: 'break-1',
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    shiftDate: '2024-01-15',
    shiftStart: '07:00',
    shiftEnd: '15:00',
    breakStart: '11:00',
    breakEnd: '11:30',
    breakType: 'meal',
    status: 'scheduled',
    autoScheduled: true,
  },
  {
    id: 'break-2',
    staffId: 'staff-2',
    staffName: 'Mike Chen',
    shiftDate: '2024-01-15',
    shiftStart: '08:00',
    shiftEnd: '16:00',
    breakStart: '11:30',
    breakEnd: '12:00',
    breakType: 'meal',
    status: 'taken',
    autoScheduled: true,
  },
  {
    id: 'break-3',
    staffId: 'staff-3',
    staffName: 'Emma Wilson',
    shiftDate: '2024-01-15',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    breakStart: '12:00',
    breakEnd: '12:30',
    breakType: 'meal',
    status: 'in-progress',
    autoScheduled: true,
  },
  {
    id: 'break-4',
    staffId: 'staff-4',
    staffName: 'James Brown',
    shiftDate: '2024-01-15',
    shiftStart: '06:00',
    shiftEnd: '14:00',
    breakStart: '10:00',
    breakEnd: '10:30',
    breakType: 'meal',
    status: 'missed',
    autoScheduled: false,
  },
];

// Mock coverage data
const mockCoverage: BreakCoverage[] = [
  { timeSlot: '11:00', staffOnBreak: 1, staffWorking: 7, minimumRequired: 3, coverage: 100 },
  { timeSlot: '11:15', staffOnBreak: 1, staffWorking: 7, minimumRequired: 3, coverage: 100 },
  { timeSlot: '11:30', staffOnBreak: 2, staffWorking: 6, minimumRequired: 3, coverage: 100 },
  { timeSlot: '11:45', staffOnBreak: 2, staffWorking: 6, minimumRequired: 3, coverage: 100 },
  { timeSlot: '12:00', staffOnBreak: 3, staffWorking: 5, minimumRequired: 3, coverage: 100 },
  { timeSlot: '12:15', staffOnBreak: 2, staffWorking: 6, minimumRequired: 3, coverage: 100 },
  { timeSlot: '12:30', staffOnBreak: 1, staffWorking: 7, minimumRequired: 3, coverage: 100 },
  { timeSlot: '12:45', staffOnBreak: 1, staffWorking: 7, minimumRequired: 3, coverage: 100 },
  { timeSlot: '13:00', staffOnBreak: 2, staffWorking: 6, minimumRequired: 3, coverage: 100 },
];

interface BreakSchedulingPanelProps {
  centreId?: string;
  selectedDate?: string;
  onClose?: () => void;
}

export function BreakSchedulingPanel({ centreId, selectedDate, onClose }: BreakSchedulingPanelProps) {
  const [breakRules, setBreakRules] = useState<ExtendedBreakRule[]>(mockBreakRules);
  const [scheduledBreaks, setScheduledBreaks] = useState<LocalScheduledBreak[]>(mockScheduledBreaks);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [showRuleEditor, setShowRuleEditor] = useState(false);

  const getStatusColor = (status: LocalScheduledBreak['status']) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'taken': return 'secondary';
      case 'in-progress': return 'default';
      case 'missed': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: LocalScheduledBreak['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'taken': return <CheckCircle2 className="h-3 w-3" />;
      case 'in-progress': return <Coffee className="h-3 w-3" />;
      case 'missed': return <AlertTriangle className="h-3 w-3" />;
      default: return null;
    }
  };

  const handleAutoScheduleBreaks = async () => {
    setIsAutoScheduling(true);
    toast.info('Auto-scheduling breaks based on rules...');
    
    // Simulate auto-scheduling
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newBreaks: LocalScheduledBreak[] = [
      ...scheduledBreaks,
      {
        id: `break-${Date.now()}`,
        staffId: 'staff-5',
        staffName: 'Lisa Park',
        shiftDate: selectedDate || '2024-01-15',
        shiftStart: '10:00',
        shiftEnd: '18:00',
        breakStart: '13:00',
        breakEnd: '13:30',
        breakType: 'meal',
        status: 'scheduled',
        autoScheduled: true,
      },
    ];
    
    setScheduledBreaks(newBreaks);
    setIsAutoScheduling(false);
    toast.success('Breaks auto-scheduled successfully');
  };

  const handleToggleRule = (ruleId: string) => {
    setBreakRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
    toast.success('Rule updated');
  };

  const handleDeleteBreak = (breakId: string) => {
    setScheduledBreaks(prev => prev.filter(b => b.id !== breakId));
    toast.success('Break removed');
  };

  const takenBreaks = scheduledBreaks.filter(b => b.status === 'taken').length;
  const missedBreaks = scheduledBreaks.filter(b => b.status === 'missed').length;
  const inProgressBreaks = scheduledBreaks.filter(b => b.status === 'in-progress').length;

  return (
    <div className="space-y-4 p-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Breaks</p>
                <p className="text-lg font-semibold">{scheduledBreaks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">{takenBreaks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-lg font-semibold">{inProgressBreaks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Missed</p>
                <p className="text-lg font-semibold">{missedBreaks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Schedule Action */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Automatic Break Scheduling</CardTitle>
              <CardDescription>Generate optimal break times based on rules</CardDescription>
            </div>
            <Button 
              onClick={handleAutoScheduleBreaks} 
              disabled={isAutoScheduling}
              size="sm"
            >
              {isAutoScheduling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Schedule
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {isAutoScheduling && (
          <CardContent className="pt-0">
            <LinearProgress />
          </CardContent>
        )}
      </Card>

      {/* Break Rules */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Break Rules</CardTitle>
              <CardDescription>Configure automatic break allocation rules</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowRuleEditor(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {breakRules.map(rule => (
                <div 
                  key={rule.id} 
                  className={`p-3 rounded-lg border ${rule.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={rule.isActive} 
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.minShiftDuration}-{rule.shiftDurationMax || 12}h shifts • {rule.breakDuration}min break
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.isPaid ? 'default' : 'secondary'}>
                        {rule.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                      {rule.staggerBreaks && (
                        <Badge variant="outline">Staggered</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {rule.mustBeTakenBetween && (
                    <p className="text-xs text-muted-foreground mt-1 ml-12">
                      Must be taken between {rule.mustBeTakenBetween.start} - {rule.mustBeTakenBetween.end}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coverage Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Break Coverage Timeline</CardTitle>
          <CardDescription>Staff coverage during break periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            {mockCoverage.map((slot, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div 
                  className={`h-8 rounded-sm mb-1 flex items-center justify-center text-xs font-medium ${
                    slot.staffWorking >= slot.minimumRequired 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {slot.staffWorking}
                </div>
                <p className="text-[10px] text-muted-foreground">{slot.timeSlot.split(':')[1] === '00' ? slot.timeSlot : ''}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Minimum required: {mockCoverage[0]?.minimumRequired || 3} staff</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30" /> Adequate
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/30" /> Understaffed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Breaks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scheduled Breaks</CardTitle>
          <CardDescription>Today's break schedule for all staff</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {scheduledBreaks.map(breakItem => (
                <div 
                  key={breakItem.id} 
                  className="p-3 rounded-lg border bg-background flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Coffee className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{breakItem.staffName}</p>
                      <p className="text-xs text-muted-foreground">
                        Shift: {breakItem.shiftStart} - {breakItem.shiftEnd}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {breakItem.breakStart} - {breakItem.breakEnd}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{breakItem.breakType}</p>
                    </div>
                    <Badge variant={getStatusColor(breakItem.status)} className="flex items-center gap-1">
                      {getStatusIcon(breakItem.status)}
                      <span className="capitalize">{breakItem.status}</span>
                    </Badge>
                    {breakItem.autoScheduled && (
                      <Chip label="Auto" size="small" variant="outlined" />
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteBreak(breakItem.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
