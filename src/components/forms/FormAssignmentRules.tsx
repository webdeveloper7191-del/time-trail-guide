import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
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
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  FormAssignment,
  AssignmentTarget,
  AssignmentTrigger,
  FormTemplate,
} from '@/types/forms';
import { mockFormAssignments, mockFormTemplates } from '@/data/mockFormData';

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

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface FormAssignmentRulesProps {
  templateId?: string;
}

export function FormAssignmentRules({ templateId }: FormAssignmentRulesProps) {
  const [assignments, setAssignments] = useState<FormAssignment[]>(mockFormAssignments);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FormAssignment | null>(null);
  
  // Form state for create/edit
  const [formState, setFormState] = useState<Partial<FormAssignment>>({
    name: '',
    templateId: templateId || '',
    targetType: 'shift_staff',
    trigger: 'roster_shift_start',
    isActive: true,
    dueAfterMinutes: 30,
  });

  const filteredAssignments = useMemo(() => {
    if (!templateId) return assignments;
    return assignments.filter(a => a.templateId === templateId);
  }, [assignments, templateId]);

  const getTemplateName = (id: string) => {
    return mockFormTemplates.find(t => t.id === id)?.name || 'Unknown Template';
  };

  const handleCreate = () => {
    setFormState({
      name: '',
      templateId: templateId || '',
      targetType: 'shift_staff',
      trigger: 'roster_shift_start',
      isActive: true,
      dueAfterMinutes: 30,
    });
    setEditingAssignment(null);
    setShowCreateModal(true);
  };

  const handleEdit = (assignment: FormAssignment) => {
    setFormState(assignment);
    setEditingAssignment(assignment);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (editingAssignment) {
      setAssignments(prev =>
        prev.map(a =>
          a.id === editingAssignment.id
            ? { ...a, ...formState, updatedAt: new Date().toISOString() }
            : a
        )
      );
    } else {
      const newAssignment: FormAssignment = {
        id: `assignment-${Date.now()}`,
        templateId: formState.templateId || '',
        name: formState.name || 'New Assignment',
        targetType: formState.targetType || 'shift_staff',
        trigger: formState.trigger || 'roster_shift_start',
        dueAfterMinutes: formState.dueAfterMinutes,
        schedule: formState.schedule,
        escalationRules: formState.escalationRules,
        isActive: formState.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAssignments(prev => [newAssignment, ...prev]);
    }
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setAssignments(prev =>
      prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      )
    );
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
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Rule
          </Button>
        </Stack>
      </Box>

      {/* Rules List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id}>
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

                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      {/* Target Type */}
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {targetTypeIcons[assignment.targetType]}
                        <Typography variant="caption">
                          {targetTypeLabels[assignment.targetType]}
                        </Typography>
                      </Stack>

                      {/* Trigger */}
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {triggerIcons[assignment.trigger]}
                        <Typography variant="caption">
                          {triggerLabels[assignment.trigger]}
                        </Typography>
                      </Stack>

                      {/* Due Time */}
                      {assignment.dueAfterMinutes && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Timer className="h-4 w-4" />
                          <Typography variant="caption">
                            Due in {assignment.dueAfterMinutes} min
                          </Typography>
                        </Stack>
                      )}

                      {/* Schedule Info */}
                      {assignment.schedule && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <CalendarDays className="h-4 w-4" />
                          <Typography variant="caption">
                            {assignment.schedule.frequency}
                            {assignment.schedule.daysOfWeek && (
                              <> on {assignment.schedule.daysOfWeek.map(d => daysOfWeek[d]).join(', ')}</>
                            )}
                            {assignment.schedule.time && <> at {assignment.schedule.time}</>}
                          </Typography>
                        </Stack>
                      )}

                      {/* Escalation */}
                      {assignment.escalationRules && assignment.escalationRules.length > 0 && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Bell className="h-4 w-4" />
                          <Typography variant="caption">
                            {assignment.escalationRules.length} escalation rule(s)
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Switch
                      size="small"
                      checked={assignment.isActive}
                      onChange={() => handleToggleActive(assignment.id)}
                    />
                    <IconButton size="small" onClick={() => handleEdit(assignment)}>
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(assignment.id)}>
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
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Rule
              </Button>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
            </DialogTitle>
          </DialogHeader>

          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Rule Name */}
            <TextField
              fullWidth
              label="Rule Name"
              value={formState.name || ''}
              onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Daily Opening Check - All Staff"
            />

            {/* Template Selection */}
            <FormControl fullWidth>
              <InputLabel>Form Template</InputLabel>
              <Select
                value={formState.templateId || ''}
                label="Form Template"
                onChange={(e) => setFormState(prev => ({ ...prev, templateId: e.target.value }))}
              >
                {mockFormTemplates.filter(t => t.status === 'published').map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Target Type */}
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={formState.targetType || 'shift_staff'}
                label="Assign To"
                onChange={(e) => setFormState(prev => ({ ...prev, targetType: e.target.value as AssignmentTarget }))}
              >
                {Object.entries(targetTypeLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {targetTypeIcons[key as AssignmentTarget]}
                      <span>{label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {formState.targetType === 'shift_staff' && 'Form will be assigned to whoever is rostered on shift'}
                {formState.targetType === 'role' && 'Select specific roles to receive this form'}
                {formState.targetType === 'location' && 'Assign to all staff at selected locations'}
              </FormHelperText>
            </FormControl>

            {/* Trigger */}
            <FormControl fullWidth>
              <InputLabel>Trigger</InputLabel>
              <Select
                value={formState.trigger || 'roster_shift_start'}
                label="Trigger"
                onChange={(e) => setFormState(prev => ({ ...prev, trigger: e.target.value as AssignmentTrigger }))}
              >
                {Object.entries(triggerLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {triggerIcons[key as AssignmentTrigger]}
                      <span>{label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Schedule Options (for scheduled trigger) */}
            {formState.trigger === 'scheduled' && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Schedule Settings</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        value={formState.schedule?.frequency || 'daily'}
                        label="Frequency"
                        onChange={(e) => setFormState(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, frequency: e.target.value as any }
                        }))}
                      >
                        <MenuItem value="once">Once</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>

                    {formState.schedule?.frequency === 'weekly' && (
                      <Stack direction="row" spacing={0.5}>
                        {daysOfWeek.map((day, index) => (
                          <Chip
                            key={day}
                            label={day}
                            size="small"
                            variant={formState.schedule?.daysOfWeek?.includes(index) ? 'filled' : 'outlined'}
                            onClick={() => {
                              const current = formState.schedule?.daysOfWeek || [];
                              const updated = current.includes(index)
                                ? current.filter(d => d !== index)
                                : [...current, index];
                              setFormState(prev => ({
                                ...prev,
                                schedule: { ...prev.schedule, daysOfWeek: updated }
                              }));
                            }}
                          />
                        ))}
                      </Stack>
                    )}

                    <TextField
                      type="time"
                      label="Time"
                      size="small"
                      value={formState.schedule?.time || '09:00'}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, time: e.target.value }
                      }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Due Time */}
            <TextField
              fullWidth
              type="number"
              label="Due After (minutes)"
              value={formState.dueAfterMinutes || ''}
              onChange={(e) => setFormState(prev => ({ ...prev, dueAfterMinutes: Number(e.target.value) }))}
              helperText="How long staff have to complete the form after it's assigned"
            />

            {/* Active Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={formState.isActive ?? true}
                  onChange={(e) => setFormState(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Rule is active"
            />
          </Stack>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>
              {editingAssignment ? 'Save Changes' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
