import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  IconButton, 
  Paper, 
  TextField,
  Drawer,
  Divider,
  Button as MuiButton,
  Chip,
  InputAdornment,
} from '@mui/material';
import { 
  Bookmark, 
  BookmarkPlus, 
  Search, 
  Trash2, 
  X, 
  Plus,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  Clock,
  CalendarClock,
  ChevronDown,
  ListChecks,
  Circle,
  CheckSquare,
  PenTool,
  Camera,
  Video,
  Paperclip,
  ScanBarcode,
  QrCode,
  MapPin,
  Users,
  Heading,
  Info,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormField, FieldTemplate, FieldType, FIELD_TYPES } from '@/types/forms';
import { toast } from 'sonner';

// Icon mapping for field types
const FIELD_ICONS: Record<FieldType, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  number: Hash,
  date: Calendar,
  time: Clock,
  datetime: CalendarClock,
  dropdown: ChevronDown,
  multi_select: ListChecks,
  radio: Circle,
  checkbox: CheckSquare,
  signature: PenTool,
  photo_upload: Camera,
  video_upload: Video,
  file_upload: Paperclip,
  barcode_scan: ScanBarcode,
  qr_scan: QrCode,
  location: MapPin,
  staff_selector: Users,
  section_header: Heading,
  instructions: Info,
};

// Default field templates
const DEFAULT_FIELD_TEMPLATES: FieldTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Required Text Field',
    description: 'A required short text input',
    field: {
      type: 'short_text',
      label: 'Required Field',
      required: true,
      placeholder: 'Enter value...',
    },
    createdAt: new Date().toISOString(),
    category: 'basic',
  },
  {
    id: 'tpl-2',
    name: 'Yes/No Question',
    description: 'Radio buttons with Yes/No options',
    field: {
      type: 'radio',
      label: 'Yes/No Question',
      required: true,
      options: [
        { id: 'opt-yes', label: 'Yes', value: 'yes', score: 1 },
        { id: 'opt-no', label: 'No', value: 'no', score: 0 },
      ],
      scoring: { enabled: true, passValue: 'yes' },
    },
    createdAt: new Date().toISOString(),
    category: 'choice',
  },
  {
    id: 'tpl-3',
    name: 'Photo Evidence',
    description: 'Required photo upload with max 3 photos',
    field: {
      type: 'photo_upload',
      label: 'Photo Evidence',
      required: true,
      settings: { maxFiles: 3 },
    },
    createdAt: new Date().toISOString(),
    category: 'media',
  },
  {
    id: 'tpl-4',
    name: 'Temperature Reading',
    description: 'Number input with min/max range for temperature',
    field: {
      type: 'number',
      label: 'Temperature (°C)',
      required: true,
      settings: { min: -20, max: 50, step: 0.5 },
      scoring: { enabled: true, passValue: 5, failValue: 8 },
    },
    createdAt: new Date().toISOString(),
    category: 'basic',
  },
  {
    id: 'tpl-5',
    name: 'Staff Signature',
    description: 'Required digital signature field',
    field: {
      type: 'signature',
      label: 'Staff Signature',
      required: true,
    },
    createdAt: new Date().toISOString(),
    category: 'media',
  },
  {
    id: 'tpl-6',
    name: 'Condition Rating',
    description: 'Dropdown for condition assessment',
    field: {
      type: 'dropdown',
      label: 'Condition',
      required: true,
      options: [
        { id: 'opt-1', label: 'Excellent', value: 'excellent', score: 4 },
        { id: 'opt-2', label: 'Good', value: 'good', score: 3 },
        { id: 'opt-3', label: 'Fair', value: 'fair', score: 2 },
        { id: 'opt-4', label: 'Poor', value: 'poor', score: 1 },
        { id: 'opt-5', label: 'Critical', value: 'critical', score: 0 },
      ],
      scoring: { enabled: true },
    },
    createdAt: new Date().toISOString(),
    category: 'choice',
  },
];

interface FieldTemplatesLibraryProps {
  open: boolean;
  onClose: () => void;
  onAddField: (field: Omit<FormField, 'id' | 'order' | 'sectionId'>) => void;
  currentField?: FormField | null;
  onSaveAsTemplate?: (field: FormField) => void;
}

export function FieldTemplatesLibrary({
  open,
  onClose,
  onAddField,
  currentField,
  onSaveAsTemplate,
}: FieldTemplatesLibraryProps) {
  const [templates, setTemplates] = useState<FieldTemplate[]>(DEFAULT_FIELD_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  const filteredTemplates = templates.filter(tpl =>
    tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tpl.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tpl.field.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFromTemplate = (template: FieldTemplate) => {
    onAddField({
      ...template.field,
      label: template.field.label || template.name,
    });
    toast.success(`Added "${template.name}" field`);
    onClose();
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted');
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!currentField || !newTemplateName.trim()) return;

    const newTemplate: FieldTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim(),
      field: {
        type: currentField.type,
        label: currentField.label,
        description: currentField.description,
        placeholder: currentField.placeholder,
        required: currentField.required,
        width: currentField.width,
        options: currentField.options,
        validation: currentField.validation,
        scoring: currentField.scoring,
        settings: currentField.settings,
      },
      createdAt: new Date().toISOString(),
      category: 'custom',
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setShowSaveDialog(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
    toast.success(`Saved "${newTemplate.name}" as template`);
  };

  const categories = [
    { id: 'custom', label: 'My Templates' },
    { id: 'basic', label: 'Basic Fields' },
    { id: 'choice', label: 'Choice Fields' },
    { id: 'media', label: 'Media Fields' },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400 } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Bookmark size={18} />
              <Typography variant="h6" fontWeight={600}>
                Field Templates
              </Typography>
            </Stack>
            <IconButton size="small" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Reuse commonly configured fields
          </Typography>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Save Current Field as Template */}
        {currentField && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.50' }}>
            {!showSaveDialog ? (
              <MuiButton
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<BookmarkPlus size={16} />}
                onClick={() => setShowSaveDialog(true)}
              >
                Save Current Field as Template
              </MuiButton>
            ) : (
              <Stack spacing={2}>
                <Typography variant="subtitle2">Save as Template</Typography>
                <TextField
                  size="small"
                  fullWidth
                  label="Template Name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  autoFocus
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Description (optional)"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                />
                <Stack direction="row" spacing={1}>
                  <MuiButton 
                    variant="text" 
                    size="small"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </MuiButton>
                  <MuiButton 
                    variant="contained" 
                    size="small"
                    onClick={handleSaveCurrentAsTemplate}
                    disabled={!newTemplateName.trim()}
                  >
                    Save Template
                  </MuiButton>
                </Stack>
              </Stack>
            )}
          </Box>
        )}

        {/* Template List */}
        <ScrollArea className="flex-1">
          <Box sx={{ p: 2 }}>
            {categories.map(category => {
              const categoryTemplates = filteredTemplates.filter(t => 
                t.category === category.id || (!t.category && category.id === 'basic')
              );
              
              if (categoryTemplates.length === 0) return null;

              return (
                <Box key={category.id} sx={{ mb: 3 }}>
                  <Typography 
                    variant="caption" 
                    fontWeight={600} 
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {category.label}
                  </Typography>
                  <Stack spacing={1}>
                    {categoryTemplates.map(template => {
                      const Icon = FIELD_ICONS[template.field.type];
                      const isCustom = template.id.startsWith('tpl-custom');

                      return (
                        <Paper
                          key={template.id}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: 'grey.50',
                              '& .delete-btn': {
                                opacity: 1,
                              },
                            },
                          }}
                          onClick={() => handleAddFromTemplate(template)}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box
                              sx={{
                                p: 0.75,
                                borderRadius: 0.75,
                                bgcolor: 'primary.100',
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Icon size={14} />
                            </Box>
                            <Box flex={1} sx={{ minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography variant="body2" fontWeight={500} noWrap>
                                  {template.name}
                                </Typography>
                                {template.field.required && (
                                  <Chip label="Required" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                                )}
                                {isCustom && (
                                  <Chip label="Custom" size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem' }} />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {template.description || FIELD_TYPES.find(f => f.type === template.field.type)?.label}
                              </Typography>
                            </Box>
                            {isCustom && (
                              <IconButton
                                size="small"
                                className="delete-btn"
                                sx={{ opacity: 0, transition: 'opacity 0.15s' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template.id);
                                }}
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            )}
                            <IconButton size="small" color="primary">
                              <Plus size={14} />
                            </IconButton>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })}

            {filteredTemplates.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No templates found
                </Typography>
              </Box>
            )}
          </Box>
        </ScrollArea>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Click a template to add it to your form
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
