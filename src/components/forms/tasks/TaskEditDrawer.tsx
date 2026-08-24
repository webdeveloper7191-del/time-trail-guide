import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Drawer,
  Divider,
  Button as MuiButton,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  ListSubheader,
  Autocomplete,
  Alert,
} from '@mui/material';
import {
  X,
  Plus,
  Pencil,
  Upload,
  Trash2,
  File,
  Image as ImageIcon,
  GitBranch,
} from 'lucide-react';
import { taskTypesStore } from '@/lib/masterData/taskTypesStore';
import { Task, TaskFormData, TaskType, TaskPriority, TaskAttachment, TaskPipeline } from '@/types/tasks';
import { mockStaff } from '@/data/mockStaffData';
import { mockLocations, mockAreas } from '@/data/mockLocationData';
import { toast } from 'sonner';

interface TaskEditDrawerProps {
  open: boolean;
  task: Task | null;
  mode: 'create' | 'edit';
  /** Pipelines the current user may pick from (team + personal). */
  pipelines?: TaskPipeline[];
  /** Pipeline pre-selected for new tasks. */
  defaultPipelineId?: string;
  onClose: () => void;
  onSave: (data: TaskFormData, attachments: TaskAttachment[]) => void;
  onManagePipelines?: () => void;
}

const fallbackTypeOptions: { value: string; label: string; color?: string }[] = [
  { value: 'work_order', label: 'Work Order' },
  { value: 'corrective_action', label: 'Corrective Action' },
  { value: 'maintenance_request', label: 'Maintenance Request' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const staffOptions = mockStaff.map(s => ({
  id: s.id,
  name: `${s.firstName} ${s.lastName}`,
  position: s.position,
  avatar: s.avatar,
}));

export function TaskEditDrawer({
  open,
  task,
  mode,
  pipelines = [],
  defaultPipelineId,
  onClose,
  onSave,
  onManagePipelines,
}: TaskEditDrawerProps) {
  const masterTaskTypes = taskTypesStore.use();
  const typeOptions = masterTaskTypes.length
    ? masterTaskTypes.filter(t => t.status === 'active').map(t => ({ value: t.id, label: t.label, color: t.color }))
    : fallbackTypeOptions;

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    type: 'work_order',
    priority: 'medium',
    assigneeId: '',
    assigneeName: '',
    dueDate: '',
    location: '',
    locationId: '',
    areaId: '',
    areaName: '',
    pipelineId: defaultPipelineId || pipelines[0]?.id || '',
    stageId: '',
  });
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when task changes or drawer opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && task) {
        setFormData({
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          assigneeId: task.assigneeId || '',
          assigneeName: task.assigneeName || '',
          dueDate: task.dueDate || '',
          location: task.location || '',
          locationId: task.locationId || '',
          areaId: task.areaId || '',
          areaName: task.areaName || '',
          pipelineId: task.pipelineId || defaultPipelineId || pipelines[0]?.id || '',
          stageId: task.stageId || '',
        });
        setAttachments(task.attachments || []);
      } else {
        setFormData({
          title: '',
          description: '',
          type: 'work_order',
          priority: 'medium',
          assigneeId: '',
          assigneeName: '',
          dueDate: '',
          location: '',
          locationId: '',
          areaId: '',
          areaName: '',
          pipelineId: defaultPipelineId || pipelines[0]?.id || '',
          stageId: '',
        });
        setAttachments([]);
      }
      setErrors({});
    }
  }, [open, mode, task, defaultPipelineId, pipelines]);

  const systemPipelines = pipelines.filter(p => (p.scope ?? 'system') === 'system');
  const personalPipelines = pipelines.filter(p => p.scope === 'personal');
  const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId) || null;
  const pipelineStages = selectedPipeline
    ? [...selectedPipeline.stages].sort((a, b) => a.order - b.order)
    : [];

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    const firstStage = pipeline ? [...pipeline.stages].sort((a, b) => a.order - b.order)[0] : undefined;
    setFormData(prev => ({ ...prev, pipelineId, stageId: firstStage?.id || '' }));
  };

  const areaOptions = mockAreas.filter(
    a => !formData.locationId || a.locationId === formData.locationId,
  );

  const handleLocationChange = (locationId: string) => {
    const location = mockLocations.find(l => l.id === locationId);
    setFormData(prev => ({
      ...prev,
      locationId,
      location: location?.name || '',
      // Clear the area when it no longer belongs to the chosen location.
      areaId: '',
      areaName: '',
    }));
  };

  const handleAreaChange = (areaId: string) => {
    const area = mockAreas.find(a => a.id === areaId);
    setFormData(prev => ({ ...prev, areaId, areaName: area?.name || '' }));
  };

  const handleAssigneeChange = (_: any, value: typeof staffOptions[0] | null) => {
    setFormData(prev => ({
      ...prev,
      assigneeId: value?.id || '',
      assigneeName: value?.name || '',
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: TaskAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: reader.result as string,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Current User',
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be under 200 characters';
    }
    if (formData.description.length > 2000) {
      newErrors.description = 'Description must be under 2000 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (!formData.stageId && pipelineStages[0]) {
      formData.stageId = pipelineStages[0].id;
    }
    onSave(formData, attachments);
    onClose();
  };

  const selectedAssignee = staffOptions.find(s => s.id === formData.assigneeId) || null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 520 } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              {mode === 'create' ? <Plus size={18} /> : <Pencil size={18} />}
              <Typography variant="h6" fontWeight={600}>
                {mode === 'create' ? 'Create Task' : 'Edit Task'}
              </Typography>
            </Stack>
            <IconButton size="small" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Stack spacing={3}>
            {/* Title */}
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title || `${formData.title.length}/200`}
              placeholder="Brief task title..."
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              error={!!errors.description}
              helperText={errors.description || `${formData.description.length}/2000`}
              placeholder="Describe the task in detail..."
            />

            <Divider />

            {/* Type & Priority */}
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <MuiSelect
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TaskType }))}
                >
                  {typeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {opt.color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color }} />}
                        <span>{opt.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}

                </MuiSelect>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <MuiSelect
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                >
                  {priorityOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </Stack>

            {/* Assignee */}
            <Autocomplete
              options={staffOptions}
              value={selectedAssignee}
              onChange={handleAssigneeChange}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      component="img"
                      src={option.avatar}
                      alt={option.name}
                      sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.position}</Typography>
                    </Box>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee"
                  size="small"
                  placeholder="Select staff member..."
                />
              )}
            />

            {/* Due Date */}
            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <Divider />

            {/* Pipeline & Stage */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={500}>Pipeline</Typography>
                {onManagePipelines && (
                  <MuiButton size="small" startIcon={<GitBranch size={14} />} onClick={onManagePipelines}>
                    Manage
                  </MuiButton>
                )}
              </Stack>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Pipeline</InputLabel>
                  <MuiSelect
                    value={pipelines.some(p => p.id === formData.pipelineId) ? formData.pipelineId : ''}
                    label="Pipeline"
                    onChange={(e) => handlePipelineChange(e.target.value as string)}
                  >
                    {systemPipelines.length > 0 && (
                      <ListSubheader>Team pipelines (system)</ListSubheader>
                    )}
                    {systemPipelines.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                    {personalPipelines.length > 0 && (
                      <ListSubheader>My pipelines</ListSubheader>
                    )}
                    {personalPipelines.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>

                <FormControl fullWidth size="small" disabled={pipelineStages.length === 0}>
                  <InputLabel>Stage</InputLabel>
                  <MuiSelect
                    value={pipelineStages.some(st => st.id === formData.stageId) ? formData.stageId : ''}
                    label="Stage"
                    onChange={(e) => setFormData(prev => ({ ...prev, stageId: e.target.value as string }))}
                  >
                    {pipelineStages.map(st => (
                      <MenuItem key={st.id} value={st.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: st.color }} />
                          <span>{st.name}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </Stack>
              {selectedPipeline && (
                <Typography variant="caption" color="text.secondary">
                  {(selectedPipeline.scope ?? 'system') === 'system'
                    ? 'Team pipeline — shared with everyone.'
                    : 'Personal pipeline — visible only to you.'}
                </Typography>
              )}
            </Box>

            {/* Location & Area */}
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <MuiSelect
                  value={formData.locationId || ''}
                  label="Location"
                  onChange={(e) => handleLocationChange(e.target.value as string)}
                >
                  <MenuItem value="">No location</MenuItem>
                  {mockLocations.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth size="small" disabled={!formData.locationId}>
                <InputLabel>Area</InputLabel>
                <MuiSelect
                  value={areaOptions.some(a => a.id === formData.areaId) ? formData.areaId : ''}
                  label="Area"
                  onChange={(e) => handleAreaChange(e.target.value as string)}
                >
                  <MenuItem value="">All areas</MenuItem>
                  {areaOptions.map(a => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </Stack>

            <Divider />

            {/* Attachments */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Attachments ({attachments.length})
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <MuiButton
                  size="small"
                  startIcon={<Upload size={14} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add Files
                </MuiButton>
              </Stack>

              {attachments.length === 0 ? (
                <Alert severity="info" sx={{ py: 1 }}>
                  No attachments. Click "Add Files" to upload photos or documents.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {attachments.map(att => (
                    <Box
                      key={att.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'grey.50',
                      }}
                    >
                      {att.type.startsWith('image/') ? (
                        <Box
                          component="img"
                          src={att.url}
                          alt={att.name}
                          sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', mr: 1.5 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: 'primary.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5,
                          }}
                        >
                          <File size={20} />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {att.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(att.size)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => removeAttachment(att.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <MuiButton variant="text" onClick={onClose}>
              Cancel
            </MuiButton>
            <MuiButton variant="contained" onClick={handleSave}>
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </MuiButton>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
