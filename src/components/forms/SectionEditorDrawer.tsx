import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Drawer,
  Switch,
  FormControlLabel,
  Divider,
  Button as MuiButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  X,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Link2,
  Type,
} from 'lucide-react';
import { FormSection } from '@/types/forms';
import { toast } from 'sonner';

interface SectionEditorDrawerProps {
  open: boolean;
  section: FormSection | null;
  onClose: () => void;
  onSave: (updates: Partial<FormSection>) => void;
}

export function SectionEditorDrawer({
  open,
  section,
  onClose,
  onSave,
}: SectionEditorDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [collapsible, setCollapsible] = useState(false);
  const [defaultCollapsed, setDefaultCollapsed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Text formatting state
  const [textFormatting, setTextFormatting] = useState<string[]>([]);

  useEffect(() => {
    if (section) {
      setTitle(section.title || '');
      setDescription(section.description || '');
      setCollapsible(section.collapsible ?? false);
      setDefaultCollapsed(section.defaultCollapsed ?? false);
      setErrors({});
      setTextFormatting([]);
    }
  }, [section, open]);

  const handleFormat = (
    _event: React.MouseEvent<HTMLElement>,
    newFormats: string[]
  ) => {
    setTextFormatting(newFormats);
  };

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById('section-description') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);

    let newText = '';
    let prefix = '';
    let suffix = '';

    switch (format) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '_';
        suffix = '_';
        break;
      case 'underline':
        prefix = '<u>';
        suffix = '</u>';
        break;
      case 'heading':
        prefix = '## ';
        break;
      case 'bullet':
        prefix = '• ';
        break;
      case 'numbered':
        prefix = '1. ';
        break;
      case 'link':
        prefix = '[';
        suffix = '](url)';
        break;
    }

    if (selectedText) {
      newText = description.substring(0, start) + prefix + selectedText + suffix + description.substring(end);
    } else {
      newText = description.substring(0, start) + prefix + suffix + description.substring(start);
    }

    setDescription(newText);
    
    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + (selectedText ? selectedText.length : 0);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Section title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be under 100 characters';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be under 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      collapsible,
      defaultCollapsed: collapsible ? defaultCollapsed : false,
    });
    toast.success('Section updated');
    onClose();
  };

  if (!section) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 420 } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Type size={18} />
              <Typography variant="h6" fontWeight={600}>
                Edit Section
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
            {/* Section Title */}
            <TextField
              label="Section Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              error={!!errors.title}
              helperText={errors.title || `${title.length}/100 characters`}
              autoFocus
              placeholder="Enter section title..."
            />

            {/* Description with Formatting Toolbar */}
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                Description
              </Typography>
              
              {/* Formatting Toolbar */}
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderBottom: 0,
                  borderRadius: '4px 4px 0 0',
                  bgcolor: 'grey.50',
                  p: 0.5,
                }}
              >
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  <Tooltip title="Bold">
                    <IconButton size="small" onClick={() => insertFormatting('bold')}>
                      <Bold size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic">
                    <IconButton size="small" onClick={() => insertFormatting('italic')}>
                      <Italic size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Underline">
                    <IconButton size="small" onClick={() => insertFormatting('underline')}>
                      <UnderlineIcon size={14} />
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  <Tooltip title="Heading">
                    <IconButton size="small" onClick={() => insertFormatting('heading')}>
                      <Heading2 size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Bullet List">
                    <IconButton size="small" onClick={() => insertFormatting('bullet')}>
                      <List size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Numbered List">
                    <IconButton size="small" onClick={() => insertFormatting('numbered')}>
                      <ListOrdered size={14} />
                    </IconButton>
                  </Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  <Tooltip title="Insert Link">
                    <IconButton size="small" onClick={() => insertFormatting('link')}>
                      <Link2 size={14} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {/* Description Text Area */}
              <TextField
                id="section-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={5}
                placeholder="Add instructions or context for this section... (supports markdown)"
                error={!!errors.description}
                helperText={errors.description || `${description.length}/500 characters`}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0 0 4px 4px',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Supports markdown formatting: **bold**, _italic_, • bullets
              </Typography>
            </Box>

            <Divider />

            {/* Section Behavior */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Section Behavior
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={collapsible}
                      onChange={(e) => setCollapsible(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Collapsible Section</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow users to expand/collapse this section
                      </Typography>
                    </Box>
                  }
                />

                {collapsible && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultCollapsed}
                        onChange={(e) => setDefaultCollapsed(e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">Start Collapsed</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Section is collapsed by default when form loads
                        </Typography>
                      </Box>
                    }
                    sx={{ ml: 3 }}
                  />
                )}
              </Stack>
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
              Save Changes
            </MuiButton>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
