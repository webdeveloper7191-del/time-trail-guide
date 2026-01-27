import { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Autocomplete,
  IconButton,
  Chip,
  Avatar,
} from '@mui/material';
import { X, Upload, FileText, Image, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PerformanceTask,
  PerformanceTaskType,
  PerformanceTaskPriority,
  PerformanceTaskFormData,
  PerformanceTaskAttachment,
  PerformanceTaskPipeline,
  performanceTaskTypeConfig,
  performanceTaskPriorityConfig,
} from '@/types/performanceTasks';
import { Goal, PerformanceReview } from '@/types/performance';
import { mockStaff } from '@/data/mockStaffData';
import { toast } from 'sonner';

interface PerformanceTaskEditDrawerProps {
  open: boolean;
  task: PerformanceTask | null;
  mode: 'create' | 'edit';
  goals?: Goal[];
  reviews?: PerformanceReview[];
  pipelines: PerformanceTaskPipeline[];
  onClose: () => void;
  onSave: (formData: PerformanceTaskFormData, attachments: PerformanceTaskAttachment[]) => void;
}

const staffOptions = mockStaff.map(s => ({
  id: s.id,
  name: `${s.firstName} ${s.lastName}`,
  position: s.position,
  avatar: s.avatar,
}));

export function PerformanceTaskEditDrawer({
  open,
  task,
  mode,
  goals = [],
  reviews = [],
  pipelines,
  onClose,
  onSave,
}: PerformanceTaskEditDrawerProps) {
  const [formData, setFormData] = useState<PerformanceTaskFormData>({
    title: '',
    description: '',
    type: 'development_task',
    priority: 'medium',
    assigneeId: '',
    assigneeName: '',
    createdForId: '',
    createdForName: '',
    dueDate: '',
    linkedGoalId: undefined,
    linkedReviewId: undefined,
  });
  const [attachments, setAttachments] = useState<PerformanceTaskAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          createdForId: task.createdForId || '',
          createdForName: task.createdForName || '',
          dueDate: task.dueDate || '',
          linkedGoalId: task.linkedGoalId,
          linkedReviewId: task.linkedReviewId,
          pipelineId: task.pipelineId,
          stageId: task.stageId,
        });
        setAttachments(task.attachments || []);
      } else {
        setFormData({
          title: '',
          description: '',
          type: 'development_task',
          priority: 'medium',
          assigneeId: '',
          assigneeName: '',
          createdForId: '',
          createdForName: '',
          dueDate: '',
          linkedGoalId: undefined,
          linkedReviewId: undefined,
        });
        setAttachments([]);
      }
      setErrors({});
    }
  }, [open, mode, task]);

  const handleAssigneeChange = (_: any, value: typeof staffOptions[0] | null) => {
    setFormData(prev => ({
      ...prev,
      assigneeId: value?.id || '',
      assigneeName: value?.name || '',
    }));
  };

  const handleForEmployeeChange = (_: any, value: typeof staffOptions[0] | null) => {
    setFormData(prev => ({
      ...prev,
      createdForId: value?.id || '',
      createdForName: value?.name || '',
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
        const newAttachment: PerformanceTaskAttachment = {
          id: `patt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    onSave(formData, attachments);
    onClose();
  };

  const selectedAssignee = staffOptions.find(s => s.id === formData.assigneeId) || null;
  const selectedForEmployee = staffOptions.find(s => s.id === formData.createdForId) || null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 480, maxWidth: '100vw' } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600}>
              {mode === 'create' ? 'Create Performance Task' : 'Edit Task'}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <X className="h-4 w-4" />
            </IconButton>
          </Stack>
        </Box>

        {/* Form */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              error={!!errors.description}
              helperText={errors.description}
              fullWidth
              multiline
              rows={3}
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Task Type</InputLabel>
                <MuiSelect
                  value={formData.type}
                  label="Task Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PerformanceTaskType }))}
                >
                  {Object.entries(performanceTaskTypeConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>{config.label}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <MuiSelect
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as PerformanceTaskPriority }))}
                >
                  {Object.entries(performanceTaskPriorityConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>{config.label}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </Stack>

            <Autocomplete
              options={staffOptions}
              value={selectedForEmployee}
              onChange={handleForEmployeeChange}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="For Employee" placeholder="Select employee this task is for" />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar src={option.avatar} sx={{ width: 32, height: 32 }}>
                      {option.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.position}</Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            />

            <Autocomplete
              options={staffOptions}
              value={selectedAssignee}
              onChange={handleAssigneeChange}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="Assign To" placeholder="Select assignee" />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar src={option.avatar} sx={{ width: 32, height: 32 }}>
                      {option.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.position}</Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            />

            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {/* Link to Goal */}
            {goals.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Link to Goal (Optional)</InputLabel>
                <MuiSelect
                  value={formData.linkedGoalId || ''}
                  label="Link to Goal (Optional)"
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedGoalId: e.target.value || undefined }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {goals.map(goal => (
                    <MenuItem key={goal.id} value={goal.id}>{goal.title}</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            )}

            {/* Link to Review */}
            {reviews.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Link to Review (Optional)</InputLabel>
                <MuiSelect
                  value={formData.linkedReviewId || ''}
                  label="Link to Review (Optional)"
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedReviewId: e.target.value || undefined }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {reviews.map(review => (
                    <MenuItem key={review.id} value={review.id}>{review.reviewCycle} Review ({review.periodStart})</MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            )}

            {/* Attachments */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" /> Add Attachments
              </Button>
              
              {attachments.length > 0 && (
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {attachments.map(att => (
                    <Box
                      key={att.id}
                      sx={{
                        p: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {att.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>{att.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(att.size)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => removeAttachment(att.id)}>
                        <Trash2 className="h-3 w-3" />
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
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
