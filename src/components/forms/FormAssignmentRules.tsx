import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Drawer,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  MapPin,
  Briefcase,
  AlertTriangle,
  Trash2,
  Edit,
  Play,
  Pause,
  CalendarDays,
  Timer,
  Bell,
  X,
  Copy,
  UserPlus,
  Building2,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FormAssignment,
  AssignmentTarget,
  AssignmentTrigger,
} from '@/types/forms';
import { mockFormAssignments, mockFormTemplates } from '@/data/mockFormData';
import { toast } from 'sonner';

// Zod schema for assignment rule form
const assignmentFormSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100, 'Name must be under 100 characters'),
  templateId: z.string().min(1, 'Form template is required'),
  targetType: z.enum(['individual', 'role', 'team', 'location', 'shift_staff']),
  targetIds: z.array(z.string()).optional(),
  trigger: z.enum(['roster_shift_start', 'roster_shift_end', 'roster_mid_shift', 'scheduled', 'event_based']),
  dueAfterMinutes: z.number().min(1, 'Due time must be at least 1 minute').max(10080, 'Due time cannot exceed 1 week').optional(),
  isActive: z.boolean(),
  schedule: z.object({
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  escalationRules: z.array(z.object({
    afterMinutes: z.number().min(1),
    notifyUserIds: z.array(z.string()),
    action: z.enum(['notify', 'reassign', 'escalate']),
  })).optional(),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

const targetTypeLabels: Record<AssignmentTarget, string> = {
  individual: 'Individual Staff',
  role: 'By Role',
  team: 'By Team',
  location: 'By Location',
  shift_staff: 'Whoever is on Shift',
};

const targetTypeIcons: Record<AssignmentTarget, React.ReactNode> = {
  individual: <Users className="h-4 w-4" />,
  role: <Briefcase className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  shift_staff: <Calendar className="h-4 w-4" />,
};

const targetTypeDescriptions: Record<AssignmentTarget, string> = {
  individual: 'Select specific staff members to receive this form',
  role: 'Assign to all staff with specific roles',
  team: 'Assign to all members of selected teams',
  location: 'Assign to all staff at selected locations',
  shift_staff: 'Form will be assigned to whoever is rostered on shift',
};

const triggerLabels: Record<AssignmentTrigger, string> = {
  roster_shift_start: 'At Shift Start',
  roster_shift_end: 'At Shift End',
  roster_mid_shift: 'Mid-Shift',
  scheduled: 'Scheduled Time',
  event_based: 'Event-Based',
};

const triggerIcons: Record<AssignmentTrigger, React.ReactNode> = {
  roster_shift_start: <Play className="h-4 w-4" />,
  roster_shift_end: <Pause className="h-4 w-4" />,
  roster_mid_shift: <Clock className="h-4 w-4" />,
  scheduled: <CalendarDays className="h-4 w-4" />,
  event_based: <AlertTriangle className="h-4 w-4" />,
};

const triggerDescriptions: Record<AssignmentTrigger, string> = {
  roster_shift_start: 'Form is assigned when a rostered shift begins',
  roster_shift_end: 'Form is assigned when a rostered shift ends',
  roster_mid_shift: 'Form is assigned during the middle of the shift',
  scheduled: 'Form is assigned at a specific scheduled time',
  event_based: 'Form is assigned when a specific event occurs (e.g., incident)',
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mock data for targets
const mockRoles = ['Care Worker', 'Nurse', 'Team Leader', 'Manager', 'Administrator'];
const mockTeams = ['Morning Team', 'Afternoon Team', 'Night Team', 'Weekend Team'];
const mockLocations = ['Main Campus', 'North Wing', 'South Wing', 'East Building'];
const mockStaff = [
  { id: 'staff-1', name: 'John Smith' },
  { id: 'staff-2', name: 'Jane Doe' },
  { id: 'staff-3', name: 'Mike Johnson' },
  { id: 'staff-4', name: 'Sarah Williams' },
];

interface FormAssignmentRulesProps {
  templateId?: string;
}

export function FormAssignmentRules({ templateId }: FormAssignmentRulesProps) {
  const [assignments, setAssignments] = useState<FormAssignment[]>(mockFormAssignments);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FormAssignment | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      name: '',
      templateId: templateId || '',
      targetType: 'shift_staff',
      trigger: 'roster_shift_start',
      isActive: true,
      dueAfterMinutes: 30,
      targetIds: [],
      schedule: {
        frequency: 'daily',
        time: '09:00',
      },
    },
  });

  const currentTrigger = watch('trigger');
  const currentTargetType = watch('targetType');
  const scheduleFrequency = watch('schedule.frequency');
  const scheduleDaysOfWeek = watch('schedule.daysOfWeek') || [];

  const filteredAssignments = useMemo(() => {
    if (!templateId) return assignments;
    return assignments.filter(a => a.templateId === templateId);
  }, [assignments, templateId]);

  const getTemplateName = (id: string) => {
    return mockFormTemplates.find(t => t.id === id)?.name || 'Unknown Template';
  };

  const handleOpenDrawer = (assignment?: FormAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      reset({
        name: assignment.name,
        templateId: assignment.templateId,
        targetType: assignment.targetType,
        targetIds: assignment.targetIds,
        trigger: assignment.trigger,
        dueAfterMinutes: assignment.dueAfterMinutes || 30,
        isActive: assignment.isActive,
        schedule: assignment.schedule || { frequency: 'daily', time: '09:00' },
        escalationRules: assignment.escalationRules,
      });
    } else {
      setEditingAssignment(null);
      reset({
        name: '',
        templateId: templateId || '',
        targetType: 'shift_staff',
        trigger: 'roster_shift_start',
        isActive: true,
        dueAfterMinutes: 30,
        targetIds: [],
        schedule: { frequency: 'daily', time: '09:00' },
      });
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingAssignment(null);
  };

  const onSubmit = (data: AssignmentFormData) => {
    // Helper to safely map escalation rules
    const mapEscalationRules = (rules?: typeof data.escalationRules) => {
      if (!rules || rules.length === 0) return undefined;
      return rules.map(rule => ({
        afterMinutes: rule.afterMinutes,
        notifyUserIds: rule.notifyUserIds,
        action: rule.action,
      }));
    };

    if (editingAssignment) {
      setAssignments(prev =>
        prev.map(a => {
          if (a.id !== editingAssignment.id) return a;
          
          const updated: FormAssignment = {
            ...a,
            name: data.name,
            templateId: data.templateId,
            targetType: data.targetType,
            targetIds: data.targetIds,
            trigger: data.trigger,
            dueAfterMinutes: data.dueAfterMinutes,
            isActive: data.isActive,
            schedule: data.schedule ? {
              frequency: data.schedule.frequency || 'daily',
              daysOfWeek: data.schedule.daysOfWeek,
              dayOfMonth: data.schedule.dayOfMonth,
              time: data.schedule.time,
              startDate: data.schedule.startDate,
              endDate: data.schedule.endDate,
            } : undefined,
            escalationRules: mapEscalationRules(data.escalationRules),
            updatedAt: new Date().toISOString(),
          };
          return updated;
        })
      );
      toast.success('Assignment rule updated');
    } else {
      const newAssignment: FormAssignment = {
        id: `assignment-${Date.now()}`,
        name: data.name,
        templateId: data.templateId,
        targetType: data.targetType,
        targetIds: data.targetIds,
        trigger: data.trigger,
        dueAfterMinutes: data.dueAfterMinutes,
        isActive: data.isActive,
        schedule: data.schedule ? {
          frequency: data.schedule.frequency || 'daily',
          daysOfWeek: data.schedule.daysOfWeek,
          dayOfMonth: data.schedule.dayOfMonth,
          time: data.schedule.time,
          startDate: data.schedule.startDate,
          endDate: data.schedule.endDate,
        } : undefined,
        escalationRules: mapEscalationRules(data.escalationRules),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAssignments(prev => [newAssignment, ...prev]);
      toast.success('Assignment rule created');
    }
    handleCloseDrawer();
  };

  const handleDelete = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    toast.success('Assignment rule deleted');
  };

  const handleDuplicate = (assignment: FormAssignment) => {
    const duplicated: FormAssignment = {
      ...assignment,
      id: `assignment-${Date.now()}`,
      name: `${assignment.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAssignments(prev => [duplicated, ...prev]);
    toast.success('Assignment rule duplicated');
  };

  const handleToggleActive = (id: string) => {
    setAssignments(prev =>
      prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive, updatedAt: new Date().toISOString() } : a
      )
    );
  };

  const getTargetOptions = () => {
    switch (currentTargetType) {
      case 'role': return mockRoles.map(r => ({ id: r, name: r }));
      case 'team': return mockTeams.map(t => ({ id: t, name: t }));
      case 'location': return mockLocations.map(l => ({ id: l, name: l }));
      case 'individual': return mockStaff;
      default: return [];
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <Typography variant="h6" fontWeight={600}>Assignment Rules</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure when and to whom forms are assigned
            </Typography>
          </div>
          <Button onClick={() => handleOpenDrawer()}>
            <Plus className="h-4 w-4 mr-1" />
            New Rule
          </Button>
        </Stack>
      </Box>

      {/* Rules List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="border-l-4" style={{ borderLeftColor: assignment.isActive ? '#22c55e' : '#94a3b8' }}>
              <CardContent className="py-4">
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {assignment.name}
                      </Typography>
                      <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                        {assignment.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      Form: {getTemplateName(assignment.templateId)}
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
                      {/* Target Type */}
                      <Chip
                        size="small"
                        icon={<Box sx={{ display: 'flex', alignItems: 'center' }}>{targetTypeIcons[assignment.targetType]}</Box>}
                        label={targetTypeLabels[assignment.targetType]}
                        variant="outlined"
                      />

                      {/* Trigger */}
                      <Chip
                        size="small"
                        icon={<Box sx={{ display: 'flex', alignItems: 'center' }}>{triggerIcons[assignment.trigger]}</Box>}
                        label={triggerLabels[assignment.trigger]}
                        variant="outlined"
                      />

                      {/* Due Time */}
                      {assignment.dueAfterMinutes && (
                        <Chip
                          size="small"
                          icon={<Timer className="h-3 w-3" />}
                          label={`Due in ${assignment.dueAfterMinutes} min`}
                          variant="outlined"
                        />
                      )}

                      {/* Schedule Info */}
                      {assignment.schedule && (
                        <Chip
                          size="small"
                          icon={<CalendarDays className="h-3 w-3" />}
                          label={`${assignment.schedule.frequency}${assignment.schedule.time ? ` at ${assignment.schedule.time}` : ''}`}
                          variant="outlined"
                        />
                      )}

                      {/* Escalation */}
                      {assignment.escalationRules && assignment.escalationRules.length > 0 && (
                        <Chip
                          size="small"
                          icon={<Bell className="h-3 w-3" />}
                          label={`${assignment.escalationRules.length} escalation(s)`}
                          variant="outlined"
                          color="warning"
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Switch
                      size="small"
                      checked={assignment.isActive}
                      onChange={() => handleToggleActive(assignment.id)}
                    />
                    <IconButton size="small" onClick={() => handleDuplicate(assignment)}>
                      <Copy className="h-4 w-4" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDrawer(assignment)}>
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(assignment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {filteredAssignments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <Typography variant="h6" color="text.secondary">
                No assignment rules yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create rules to automatically assign forms to staff
              </Typography>
              <Button onClick={() => handleOpenDrawer()}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Rule
              </Button>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Right-Side Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 480 } }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>
                {editingAssignment ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
              </Typography>
              <IconButton onClick={handleCloseDrawer}>
                <X className="h-5 w-5" />
              </IconButton>
            </Stack>
          </Box>

          {/* Drawer Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            <form id="assignment-form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                {/* Rule Name */}
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Rule Name"
                      placeholder="e.g., Daily Opening Check - All Staff"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />

                {/* Template Selection */}
                <Controller
                  name="templateId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.templateId}>
                      <InputLabel>Form Template</InputLabel>
                      <MuiSelect {...field} label="Form Template">
                        {mockFormTemplates.filter(t => t.status === 'published').map(template => (
                          <MenuItem key={template.id} value={template.id}>
                            {template.name}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                      {errors.templateId && (
                        <FormHelperText>{errors.templateId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                <Divider />

                {/* Target Type Section */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    <Users className="h-4 w-4 inline mr-1" />
                    Assignment Target
                  </Typography>
                  
                  <Controller
                    name="targetType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Assign To</InputLabel>
                        <MuiSelect {...field} label="Assign To">
                          {Object.entries(targetTypeLabels).map(([key, label]) => (
                            <MenuItem key={key} value={key}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {targetTypeIcons[key as AssignmentTarget]}
                                <span>{label}</span>
                              </Stack>
                            </MenuItem>
                          ))}
                        </MuiSelect>
                        <FormHelperText>
                          {targetTypeDescriptions[currentTargetType]}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />

                  {/* Target Selection for non-shift_staff types */}
                  {currentTargetType !== 'shift_staff' && (
                    <Controller
                      name="targetIds"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>
                            Select {currentTargetType === 'individual' ? 'Staff' : currentTargetType === 'role' ? 'Roles' : currentTargetType === 'team' ? 'Teams' : 'Locations'}
                          </InputLabel>
                          <MuiSelect
                            {...field}
                            multiple
                            label={`Select ${currentTargetType === 'individual' ? 'Staff' : currentTargetType === 'role' ? 'Roles' : currentTargetType === 'team' ? 'Teams' : 'Locations'}`}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(selected as string[]).map((value) => (
                                  <Chip key={value} label={value} size="small" />
                                ))}
                              </Box>
                            )}
                          >
                            {getTargetOptions().map(option => (
                              <MenuItem key={option.id} value={option.id}>
                                {option.name}
                              </MenuItem>
                            ))}
                          </MuiSelect>
                        </FormControl>
                      )}
                    />
                  )}
                </Box>

                <Divider />

                {/* Trigger Section */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    <Zap className="h-4 w-4 inline mr-1" />
                    Trigger Condition
                  </Typography>
                  
                  <Controller
                    name="trigger"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Trigger</InputLabel>
                        <MuiSelect {...field} label="Trigger">
                          {Object.entries(triggerLabels).map(([key, label]) => (
                            <MenuItem key={key} value={key}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {triggerIcons[key as AssignmentTrigger]}
                                <span>{label}</span>
                              </Stack>
                            </MenuItem>
                          ))}
                        </MuiSelect>
                        <FormHelperText>
                          {triggerDescriptions[currentTrigger]}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Box>

                {/* Schedule Options (for scheduled trigger) */}
                {currentTrigger === 'scheduled' && (
                  <Alert severity="info" sx={{ py: 1 }}>
                    <AlertTitle sx={{ fontSize: '0.875rem' }}>Schedule Settings</AlertTitle>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <Controller
                        name="schedule.frequency"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth size="small">
                            <InputLabel>Frequency</InputLabel>
                            <MuiSelect {...field} label="Frequency">
                              <MenuItem value="once">Once</MenuItem>
                              <MenuItem value="daily">Daily</MenuItem>
                              <MenuItem value="weekly">Weekly</MenuItem>
                              <MenuItem value="monthly">Monthly</MenuItem>
                            </MuiSelect>
                          </FormControl>
                        )}
                      />

                      {scheduleFrequency === 'weekly' && (
                        <Controller
                          name="schedule.daysOfWeek"
                          control={control}
                          render={({ field }) => (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {daysOfWeek.map((day, index) => (
                                <Chip
                                  key={day}
                                  label={day}
                                  size="small"
                                  variant={scheduleDaysOfWeek.includes(index) ? 'filled' : 'outlined'}
                                  color={scheduleDaysOfWeek.includes(index) ? 'primary' : 'default'}
                                  onClick={() => {
                                    const current = field.value || [];
                                    const updated = current.includes(index)
                                      ? current.filter(d => d !== index)
                                      : [...current, index];
                                    field.onChange(updated);
                                  }}
                                />
                              ))}
                            </Stack>
                          )}
                        />
                      )}

                      {scheduleFrequency === 'monthly' && (
                        <Controller
                          name="schedule.dayOfMonth"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              label="Day of Month"
                              size="small"
                              inputProps={{ min: 1, max: 31 }}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          )}
                        />
                      )}

                      <Controller
                        name="schedule.time"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="time"
                            label="Time"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />

                      <Stack direction="row" spacing={2}>
                        <Controller
                          name="schedule.startDate"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="date"
                              label="Start Date"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              fullWidth
                            />
                          )}
                        />
                        <Controller
                          name="schedule.endDate"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="date"
                              label="End Date"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              fullWidth
                            />
                          )}
                        />
                      </Stack>
                    </Stack>
                  </Alert>
                )}

                <Divider />

                {/* Due Time */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    <Timer className="h-4 w-4 inline mr-1" />
                    Completion Time
                  </Typography>
                  
                  <Controller
                    name="dueAfterMinutes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Due After (minutes)"
                        error={!!errors.dueAfterMinutes}
                        helperText={errors.dueAfterMinutes?.message || 'How long staff have to complete the form after it is assigned'}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                </Box>

                <Divider />

                {/* Active Toggle */}
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={
                        <Stack>
                          <Typography variant="body2" fontWeight={500}>Rule is active</Typography>
                          <Typography variant="caption" color="text.secondary">
                            When active, forms will be assigned based on this rule
                          </Typography>
                        </Stack>
                      }
                    />
                  )}
                />
              </Stack>
            </form>
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outline" onClick={handleCloseDrawer}>
                Cancel
              </Button>
              <Button type="submit" form="assignment-form" disabled={isSubmitting}>
                {editingAssignment ? 'Save Changes' : 'Create Rule'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
