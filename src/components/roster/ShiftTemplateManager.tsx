import { useState } from 'react';
import {
  Button,
  TextField,
  Chip,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { ShiftTemplate, defaultShiftTemplates } from '@/types/roster';
import { Clock, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShiftTemplateManagerProps {
  open: boolean;
  onClose: () => void;
  customTemplates: ShiftTemplate[];
  onSave: (templates: ShiftTemplate[]) => void;
}

const colorOptions = [
  'hsl(200, 70%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 60%, 50%)',
  'hsl(30, 70%, 50%)',
  'hsl(340, 65%, 50%)',
  'hsl(220, 70%, 55%)',
  'hsl(45, 80%, 45%)',
  'hsl(180, 55%, 45%)',
];

export function ShiftTemplateManager({
  open,
  onClose,
  customTemplates,
  onSave
}: ShiftTemplateManagerProps) {
  const [templates, setTemplates] = useState<ShiftTemplate[]>(customTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<ShiftTemplate>>({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 30,
    color: colorOptions[0],
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newTemplate.name?.trim()) return;

    const template: ShiftTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name.trim(),
      startTime: newTemplate.startTime || '09:00',
      endTime: newTemplate.endTime || '17:00',
      breakMinutes: newTemplate.breakMinutes || 30,
      color: newTemplate.color || colorOptions[0],
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      color: colorOptions[0],
    });
    setIsAdding(false);
  };

  const handleUpdate = (id: string, updates: Partial<ShiftTemplate>) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = () => {
    onSave(templates);
    onClose();
  };

  const calculateDuration = (start: string, end: string, breakMins: number) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const totalMins = (endH * 60 + endM) - (startH * 60 + startM) - breakMins;
    return (totalMins / 60).toFixed(1);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Manage Shift Templates
          </SheetTitle>
          <SheetDescription>
            Create and manage reusable shift templates for quick scheduling
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 mt-6 h-[calc(100vh-220px)]">
          {/* Default Templates */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
              Default Templates
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {defaultShiftTemplates.map(template => (
                <Box
                  key={template.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                >
                  <Box sx={{ height: 16, width: 16, borderRadius: '50%', flexShrink: 0, bgcolor: template.color }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>{template.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {template.startTime} - {template.endTime} • {template.breakMinutes}min break
                    </Typography>
                  </Box>
                  <Chip size="small" label={`${calculateDuration(template.startTime, template.endTime, template.breakMinutes)}h`} />
                  <Chip size="small" label="Default" variant="outlined" />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Custom Templates */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                Custom Templates
              </Typography>
              {!isAdding && (
                <Button variant="text" size="small" startIcon={<Plus size={14} />} onClick={() => setIsAdding(true)}>
                  Add Template
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {templates.map(template => (
                <Box
                  key={template.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    border: 2,
                    borderColor: editingId === template.id ? 'primary.main' : 'divider',
                    bgcolor: editingId === template.id ? 'primary.light' : 'transparent',
                  }}
                >
                  {editingId === template.id ? (
                    <>
                      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 1 }}>
                        <TextField
                          value={template.name}
                          onChange={(e) => handleUpdate(template.id, { name: e.target.value })}
                          placeholder="Name"
                          size="small"
                        />
                        <TextField
                          type="time"
                          value={template.startTime}
                          onChange={(e) => handleUpdate(template.id, { startTime: e.target.value })}
                          size="small"
                        />
                        <TextField
                          type="time"
                          value={template.endTime}
                          onChange={(e) => handleUpdate(template.id, { endTime: e.target.value })}
                          size="small"
                        />
                        <TextField
                          type="number"
                          value={template.breakMinutes}
                          onChange={(e) => handleUpdate(template.id, { breakMinutes: parseInt(e.target.value) || 0 })}
                          size="small"
                          inputProps={{ min: 0, max: 120 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {colorOptions.map(color => (
                          <Box
                            key={color}
                            onClick={() => handleUpdate(template.id, { color })}
                            sx={{
                              height: 20,
                              width: 20,
                              borderRadius: '50%',
                              border: 2,
                              borderColor: template.color === color ? 'text.primary' : 'transparent',
                              bgcolor: color,
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </Box>
                      <IconButton size="small" onClick={() => setEditingId(null)}>
                        <Check size={16} />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <Box sx={{ height: 16, width: 16, borderRadius: '50%', flexShrink: 0, bgcolor: template.color }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>{template.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.startTime} - {template.endTime} • {template.breakMinutes}min break
                        </Typography>
                      </Box>
                      <Chip size="small" label={`${calculateDuration(template.startTime, template.endTime, template.breakMinutes)}h`} />
                      <IconButton size="small" onClick={() => setEditingId(template.id)}>
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(template.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </>
                  )}
                </Box>
              ))}

              {/* Add new template form */}
              {isAdding && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    border: 2,
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light',
                  }}
                >
                  <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 1 }}>
                    <TextField
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Template name"
                      size="small"
                    />
                    <TextField
                      type="time"
                      value={newTemplate.startTime}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, startTime: e.target.value }))}
                      size="small"
                    />
                    <TextField
                      type="time"
                      value={newTemplate.endTime}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, endTime: e.target.value }))}
                      size="small"
                    />
                    <TextField
                      type="number"
                      value={newTemplate.breakMinutes}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, breakMinutes: parseInt(e.target.value) || 0 }))}
                      placeholder="Break"
                      size="small"
                      inputProps={{ min: 0, max: 120 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {colorOptions.map(color => (
                      <Box
                        key={color}
                        onClick={() => setNewTemplate(prev => ({ ...prev, color }))}
                        sx={{
                          height: 20,
                          width: 20,
                          borderRadius: '50%',
                          border: 2,
                          borderColor: newTemplate.color === color ? 'text.primary' : 'transparent',
                          bgcolor: color,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Box>
                  <IconButton size="small" onClick={handleAdd} disabled={!newTemplate.name?.trim()}>
                    <Check size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setIsAdding(false)}>
                    <X size={16} />
                  </IconButton>
                </Box>
              )}

              {templates.length === 0 && !isAdding && (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2">No custom templates yet. Click "Add Template" to create one.</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Save size={16} />}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
