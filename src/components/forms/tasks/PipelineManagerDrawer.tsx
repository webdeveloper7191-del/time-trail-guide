import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Drawer,
  Divider,
  Button as MuiButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from '@mui/material';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  Palette,
} from 'lucide-react';
import { TaskPipeline, TaskPipelineStage } from '@/types/tasks';
import { toast } from 'sonner';

interface PipelineManagerDrawerProps {
  open: boolean;
  pipelines: TaskPipeline[];
  onClose: () => void;
  onSave: (pipelines: TaskPipeline[]) => void;
  onCreatePipeline: (pipeline: TaskPipeline) => void;
  onUpdatePipeline: (pipeline: TaskPipeline) => void;
  onDeletePipeline: (pipelineId: string) => void;
}

const defaultColors = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#22c55e', '#f59e0b', 
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#14b8a6',
];

export function PipelineManagerDrawer({
  open,
  pipelines,
  onClose,
  onCreatePipeline,
  onUpdatePipeline,
  onDeletePipeline,
}: PipelineManagerDrawerProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<TaskPipeline | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStages, setEditStages] = useState<TaskPipelineStage[]>([]);
  const [newStageName, setNewStageName] = useState('');

  useEffect(() => {
    if (selectedPipeline) {
      setEditName(selectedPipeline.name);
      setEditDescription(selectedPipeline.description || '');
      setEditStages([...selectedPipeline.stages].sort((a, b) => a.order - b.order));
    }
  }, [selectedPipeline]);

  const handleCreateNew = () => {
    const newPipeline: TaskPipeline = {
      id: `pipeline-${Date.now()}`,
      name: 'New Pipeline',
      description: '',
      stages: [
        { id: `stage-${Date.now()}-1`, name: 'To Do', color: '#3b82f6', order: 0 },
        { id: `stage-${Date.now()}-2`, name: 'In Progress', color: '#8b5cf6', order: 1 },
        { id: `stage-${Date.now()}-3`, name: 'Done', color: '#22c55e', order: 2 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedPipeline(newPipeline);
    setIsEditing(true);
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage: TaskPipelineStage = {
      id: `stage-${Date.now()}`,
      name: newStageName.trim(),
      color: defaultColors[editStages.length % defaultColors.length],
      order: editStages.length,
    };
    setEditStages(prev => [...prev, newStage]);
    setNewStageName('');
  };

  const handleRemoveStage = (stageId: string) => {
    if (editStages.length <= 2) {
      toast.error('Pipeline must have at least 2 stages');
      return;
    }
    setEditStages(prev => 
      prev.filter(s => s.id !== stageId).map((s, i) => ({ ...s, order: i }))
    );
  };

  const handleStageColorChange = (stageId: string, color: string) => {
    setEditStages(prev => prev.map(s => s.id === stageId ? { ...s, color } : s));
  };

  const handleStageNameChange = (stageId: string, name: string) => {
    setEditStages(prev => prev.map(s => s.id === stageId ? { ...s, name } : s));
  };

  const handleSavePipeline = () => {
    if (!editName.trim()) {
      toast.error('Pipeline name is required');
      return;
    }
    if (editStages.length < 2) {
      toast.error('Pipeline must have at least 2 stages');
      return;
    }

    const updatedPipeline: TaskPipeline = {
      ...selectedPipeline!,
      name: editName.trim(),
      description: editDescription.trim(),
      stages: editStages,
      updatedAt: new Date().toISOString(),
    };

    if (pipelines.find(p => p.id === updatedPipeline.id)) {
      onUpdatePipeline(updatedPipeline);
    } else {
      onCreatePipeline(updatedPipeline);
    }

    setIsEditing(false);
    setSelectedPipeline(null);
    toast.success('Pipeline saved');
  };

  const handleDeletePipeline = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline?.isDefault) {
      toast.error('Cannot delete the default pipeline');
      return;
    }
    onDeletePipeline(pipelineId);
    if (selectedPipeline?.id === pipelineId) {
      setSelectedPipeline(null);
      setIsEditing(false);
    }
    toast.success('Pipeline deleted');
  };

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
            <Typography variant="h6" fontWeight={600}>
              {isEditing ? 'Edit Pipeline' : 'Task Pipelines'}
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {!isEditing ? (
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                <MuiButton
                  variant="outlined"
                  startIcon={<Plus size={16} />}
                  onClick={handleCreateNew}
                  fullWidth
                >
                  Create New Pipeline
                </MuiButton>

                <Divider />

                <List disablePadding>
                  {pipelines.map(pipeline => (
                    <ListItem
                      key={pipeline.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                      onClick={() => {
                        setSelectedPipeline(pipeline);
                        setIsEditing(true);
                      }}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {pipeline.name}
                            </Typography>
                            {pipeline.isDefault && (
                              <Typography variant="caption" color="primary.main">
                                (Default)
                              </Typography>
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                            {pipeline.stages.slice(0, 5).map(stage => (
                              <Box
                                key={stage.id}
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: stage.color,
                                }}
                              />
                            ))}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              {pipeline.stages.length} stages
                            </Typography>
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePipeline(pipeline.id);
                          }}
                          disabled={pipeline.isDefault}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Stack spacing={3}>
                <TextField
                  label="Pipeline Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g., Maintenance Workflow"
                />

                <TextField
                  label="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Optional description..."
                />

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Pipeline Stages
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {editStages.map((stage, index) => (
                      <Box
                        key={stage.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'grey.50',
                        }}
                      >
                        <GripVertical size={16} className="text-muted-foreground" />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            bgcolor: stage.color,
                            border: 2,
                            borderColor: 'background.paper',
                            boxShadow: 1,
                            cursor: 'pointer',
                            position: 'relative',
                          }}
                        >
                          <input
                            type="color"
                            value={stage.color}
                            onChange={(e) => handleStageColorChange(stage.id, e.target.value)}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              opacity: 0,
                              cursor: 'pointer',
                            }}
                          />
                        </Box>
                        <TextField
                          value={stage.name}
                          onChange={(e) => handleStageNameChange(stage.id, e.target.value)}
                          size="small"
                          variant="standard"
                          sx={{ flex: 1 }}
                          InputProps={{ disableUnderline: true }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveStage(stage.id)}
                          disabled={editStages.length <= 2}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      placeholder="New stage name..."
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                      sx={{ flex: 1 }}
                    />
                    <MuiButton
                      variant="outlined"
                      size="small"
                      onClick={handleAddStage}
                      disabled={!newStageName.trim()}
                    >
                      <Plus size={16} />
                    </MuiButton>
                  </Stack>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    Drag stages to reorder. Tasks in a deleted stage will need to be reassigned.
                  </Alert>
                </Box>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {isEditing ? (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <MuiButton
                variant="text"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedPipeline(null);
                }}
              >
                Cancel
              </MuiButton>
              <MuiButton variant="contained" onClick={handleSavePipeline}>
                Save Pipeline
              </MuiButton>
            </Stack>
          ) : (
            <MuiButton variant="text" onClick={onClose} fullWidth>
              Close
            </MuiButton>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
