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
  Tooltip,
  Alert,
} from '@mui/material';
import {
  X,
  Pencil,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Image,
  Upload,
  Trash2,
} from 'lucide-react';
import { FormTemplate } from '@/types/forms';
import { templateDetailsSchema } from '@/lib/validationSchemas/formSchemas';
import { toast } from 'sonner';

interface EditTemplateDetailsDrawerProps {
  open: boolean;
  template: FormTemplate | null;
  onClose: () => void;
  onSave: (updates: { name: string; description: string; headerImage?: string }) => void;
}

export function EditTemplateDetailsDrawer({
  open,
  template,
  onClose,
  onSave,
}: EditTemplateDetailsDrawerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headerImage, setHeaderImage] = useState<string | undefined>(undefined);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (template && open) {
      setName(template.name || '');
      setDescription(template.description || '');
      setHeaderImage(template.branding?.headerImage);
      setValidationErrors({});
    }
  }, [template, open]);

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById('template-description') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);

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

    let newText: string;
    if (selectedText) {
      newText = description.substring(0, start) + prefix + selectedText + suffix + description.substring(end);
    } else {
      newText = description.substring(0, start) + prefix + suffix + description.substring(start);
    }

    setDescription(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + (selectedText ? selectedText.length : 0);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Convert to base64 for preview (in production, this would upload to storage)
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeaderImage(reader.result as string);
      toast.success('Header image added');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setHeaderImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Header image removed');
  };

  const validate = (): boolean => {
    const result = templateDetailsSchema.safeParse({ name, description });
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }
    
    setValidationErrors({});
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      headerImage,
    });
    toast.success('Template details saved');
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 480 } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Pencil size={18} />
              <Typography variant="h6" fontWeight={600}>
                Edit Template Details
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
            {/* Template Name */}
            <TextField
              label="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              error={!!validationErrors.name}
              helperText={validationErrors.name || `${name.length}/100 characters`}
              autoFocus
              placeholder="Enter template name..."
            />

            {/* Header Image Upload */}
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Image size={14} />
                  <span>Header Image</span>
                </Stack>
              </Typography>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="header-image-upload"
              />

              {headerImage ? (
                <Box>
                  {/* Image Preview */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 140,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: 1,
                      borderColor: 'divider',
                      mb: 1.5,
                    }}
                  >
                    <Box
                      component="img"
                      src={headerImage}
                      alt="Header preview"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {/* Overlay with actions */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Stack direction="row" spacing={1}>
                        <MuiButton
                          variant="contained"
                          size="small"
                          startIcon={<Upload size={14} />}
                          onClick={() => fileInputRef.current?.click()}
                          sx={{ bgcolor: 'white', color: 'text.primary', '&:hover': { bgcolor: 'grey.100' } }}
                        >
                          Replace
                        </MuiButton>
                        <MuiButton
                          variant="contained"
                          size="small"
                          startIcon={<Trash2 size={14} />}
                          onClick={handleRemoveImage}
                          color="error"
                        >
                          Remove
                        </MuiButton>
                      </Stack>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Hover over the image to replace or remove it
                  </Typography>
                </Box>
              ) : (
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: 2,
                    borderStyle: 'dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    bgcolor: 'grey.50',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                    },
                  }}
                >
                  <Upload size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to upload header image
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    PNG, JPG, or GIF (max 5MB)
                  </Typography>
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 2 }} icon={<Image size={16} />}>
                The header image appears at the top of your form, similar to Google Forms.
              </Alert>
            </Box>

            <Divider />

            {/* Description with WYSIWYG Toolbar */}
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
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={5}
                placeholder="Brief description of this form's purpose... (supports markdown)"
                error={!!validationErrors.description}
                helperText={validationErrors.description || `${description.length}/500 characters`}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0 0 4px 4px',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Supports markdown: **bold**, _italic_, ## heading, • bullets
              </Typography>
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
