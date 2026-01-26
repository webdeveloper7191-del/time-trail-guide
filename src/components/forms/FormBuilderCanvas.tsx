import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  Chip,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Settings,
  Eye,
  ChevronDown,
  ChevronUp,
  Asterisk,
  Move,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  Clock,
  CalendarClock,
  ChevronDownIcon,
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
  Zap,
  MoreVertical,
  FileCheck,
  Save,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormField, FormSection, FormTemplate, FieldType, FIELD_TYPES, FieldOption } from '@/types/forms';
import { toast } from 'sonner';

// Icon mapping for field types
const FIELD_ICONS: Record<FieldType, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  number: Hash,
  date: Calendar,
  time: Clock,
  datetime: CalendarClock,
  dropdown: ChevronDownIcon,
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

interface FormBuilderCanvasProps {
  template: FormTemplate;
  onTemplateChange: (template: FormTemplate) => void;
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string | null) => void;
}

export function FormBuilderCanvas({
  template,
  onTemplateChange,
  selectedFieldId,
  onFieldSelect,
}: FormBuilderCanvasProps) {
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionTarget, setDragOverSectionTarget] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(template.sections.map(s => s.id))
  );

  // Add a new field from the palette
  const addFieldToSection = (fieldType: FieldType, sectionId: string) => {
    const fieldDef = FIELD_TYPES.find(f => f.type === fieldType);
    const sectionFields = template.fields.filter(f => f.sectionId === sectionId);
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      label: fieldDef?.label || 'New Field',
      required: false,
      order: sectionFields.length,
      sectionId,
    };
    
    if (['dropdown', 'multi_select', 'radio'].includes(fieldType)) {
      newField.options = [
        { id: 'opt-1', label: 'Option 1', value: 'option_1' },
        { id: 'opt-2', label: 'Option 2', value: 'option_2' },
      ];
    }

    onTemplateChange({
      ...template,
      fields: [...template.fields, newField],
    });
    onFieldSelect(newField.id);
    toast.success(`Added ${fieldDef?.label || 'field'}`);
  };

  // Handle drop from palette onto section (for fields)
  const handleFieldDropZoneDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const fieldType = e.dataTransfer.types.includes('fieldtype');
    if (fieldType || draggedFieldId) {
      setDragOverSectionId(sectionId);
    }
  };

  const handleFieldDropZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSectionId(null);
  };

  const handleSectionDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSectionId(null);

    // Check if dropping a new field from palette
    const fieldType = e.dataTransfer.getData('fieldType') as FieldType;
    if (fieldType && FIELD_TYPES.some(f => f.type === fieldType)) {
      addFieldToSection(fieldType, sectionId);
      return;
    }

    // Otherwise handle reordering existing field into this section
    if (draggedFieldId) {
      const draggedField = template.fields.find(f => f.id === draggedFieldId);
      if (draggedField && draggedField.sectionId !== sectionId) {
        const sectionFields = template.fields.filter(f => f.sectionId === sectionId);
        const newFields = template.fields.map(field => {
          if (field.id === draggedFieldId) {
            return { ...field, sectionId, order: sectionFields.length };
          }
          return field;
        });
        onTemplateChange({ ...template, fields: newFields });
        toast.success('Field moved to section');
      }
      setDraggedFieldId(null);
    }
  };

  // Group fields by section
  const fieldsBySection = useMemo(() => {
    const grouped: Record<string, FormField[]> = {};
    template.sections.forEach(section => {
      grouped[section.id] = template.fields
        .filter(f => f.sectionId === section.id)
        .sort((a, b) => a.order - b.order);
    });
    // Fields without section
    grouped['_unsectioned'] = template.fields
      .filter(f => !f.sectionId)
      .sort((a, b) => a.order - b.order);
    return grouped;
  }, [template.fields, template.sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Section drag and drop handlers
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
    e.stopPropagation();
    setDraggedSectionId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('sectionId', sectionId);
  };

  const handleSectionDragOver = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (draggedSectionId && draggedSectionId !== targetSectionId) {
      setDragOverSectionTarget(targetSectionId);
    }
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionId(null);
    setDragOverSectionTarget(null);
  };

  const handleSectionDropOnSection = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      handleSectionDragEnd();
      return;
    }

    const draggedSection = template.sections.find(s => s.id === draggedSectionId);
    const targetSection = template.sections.find(s => s.id === targetSectionId);

    if (!draggedSection || !targetSection) {
      handleSectionDragEnd();
      return;
    }

    // Reorder sections
    const newSections = template.sections.map(section => {
      if (section.id === draggedSectionId) {
        return { ...section, order: targetSection.order };
      }
      if (section.id === targetSectionId) {
        return { ...section, order: draggedSection.order };
      }
      return section;
    }).sort((a, b) => a.order - b.order);

    onTemplateChange({ ...template, sections: newSections });
    toast.success('Section reordered');
    handleSectionDragEnd();
  };

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fieldId);
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    if (draggedFieldId && draggedFieldId !== fieldId) {
      setDragOverFieldId(fieldId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFieldId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      setDragOverFieldId(null);
      return;
    }

    const draggedField = template.fields.find(f => f.id === draggedFieldId);
    const targetField = template.fields.find(f => f.id === targetFieldId);

    if (!draggedField || !targetField) return;

    const newFields = template.fields.map(field => {
      if (field.id === draggedFieldId) {
        return { ...field, order: targetField.order, sectionId: targetField.sectionId };
      }
      if (field.sectionId === targetField.sectionId) {
        if (field.order >= targetField.order && field.id !== draggedFieldId) {
          return { ...field, order: field.order + 1 };
        }
      }
      return field;
    });

    onTemplateChange({ ...template, fields: newFields });
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverFieldId(null);
  };

  const duplicateField = (field: FormField) => {
    const newField: FormField = {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`,
      order: field.order + 0.5,
    };
    onTemplateChange({
      ...template,
      fields: [...template.fields, newField].map((f, i) => ({ ...f, order: Math.floor(i) })),
    });
    toast.success('Field duplicated');
  };

  const deleteField = (fieldId: string) => {
    onTemplateChange({
      ...template,
      fields: template.fields.filter(f => f.id !== fieldId),
    });
    if (selectedFieldId === fieldId) {
      onFieldSelect(null);
    }
    toast.success('Field deleted');
  };

  const renderFieldPreview = (field: FormField) => {
    const Icon = FIELD_ICONS[field.type];
    const isSelected = selectedFieldId === field.id;
    const isDragging = draggedFieldId === field.id;
    const isDragOver = dragOverFieldId === field.id;

    return (
      <Paper
        key={field.id}
        draggable
        onDragStart={(e) => handleDragStart(e, field.id)}
        onDragOver={(e) => handleDragOver(e, field.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, field.id)}
        onDragEnd={handleDragEnd}
        onClick={() => onFieldSelect(field.id)}
        sx={{
          p: 2,
          mb: 1,
          cursor: 'pointer',
          border: 2,
          borderColor: isSelected ? 'primary.main' : isDragOver ? 'primary.light' : 'transparent',
          bgcolor: isDragging ? 'action.selected' : isSelected ? 'primary.50' : 'background.paper',
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: isSelected ? 'primary.main' : 'grey.300',
            '& .field-actions': {
              opacity: 1,
            },
          },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          {/* Drag handle */}
          <Box
            sx={{
              cursor: 'grab',
              color: 'text.disabled',
              '&:hover': { color: 'text.secondary' },
              mt: 0.5,
            }}
          >
            <GripVertical size={16} />
          </Box>

          {/* Field icon */}
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: 'grey.100',
              color: 'grey.600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} />
          </Box>

          {/* Field content */}
          <Box flex={1} sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {field.label}
              </Typography>
              {field.required && (
                <Asterisk size={12} className="text-red-500" />
              )}
              {field.conditionalLogic && field.conditionalLogic.length > 0 && (
                <Zap size={12} className="text-amber-500" />
              )}
              {field.scoring?.enabled && (
                <FileCheck size={12} className="text-blue-500" />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {FIELD_TYPES.find(ft => ft.type === field.type)?.label}
              {field.description && ` • ${field.description}`}
            </Typography>

            {/* Field preview based on type */}
            <Box sx={{ mt: 1 }}>
              {renderFieldInput(field)}
            </Box>
          </Box>

          {/* Actions */}
          <Stack
            direction="row"
            spacing={0.5}
            className="field-actions"
            sx={{ opacity: 0, transition: 'opacity 0.15s' }}
          >
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); duplicateField(field); }}>
              <Copy size={14} />
            </IconButton>
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}>
              <Trash2 size={14} />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>
    );
  };

  const renderFieldInput = (field: FormField) => {
    switch (field.type) {
      case 'short_text':
        return (
          <Input
            placeholder={field.placeholder || 'Enter text...'}
            disabled
            className="h-8 text-sm bg-muted/50"
          />
        );
      case 'long_text':
        return (
          <Textarea
            placeholder={field.placeholder || 'Enter text...'}
            disabled
            className="min-h-[60px] text-sm bg-muted/50"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || '0'}
            disabled
            className="h-8 text-sm bg-muted/50 w-32"
          />
        );
      case 'date':
      case 'time':
      case 'datetime':
        return (
          <Input
            type={field.type === 'time' ? 'time' : field.type === 'datetime' ? 'datetime-local' : 'date'}
            disabled
            className="h-8 text-sm bg-muted/50 w-48"
          />
        );
      case 'dropdown':
      case 'multi_select':
        return (
          <Select disabled>
            <SelectTrigger className="h-8 text-sm bg-muted/50 w-48">
              <SelectValue placeholder="Select option..." />
            </SelectTrigger>
          </Select>
        );
      case 'radio':
        return (
          <Stack spacing={0.5}>
            {(field.options || []).slice(0, 3).map(opt => (
              <Stack key={opt.id} direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: 2,
                    borderColor: 'grey.400',
                  }}
                />
                <Typography variant="caption">{opt.label}</Typography>
              </Stack>
            ))}
            {(field.options?.length || 0) > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{(field.options?.length || 0) - 3} more options
              </Typography>
            )}
          </Stack>
        );
      case 'checkbox':
        if (field.options && field.options.length > 0) {
          return (
            <Stack spacing={0.5}>
              {field.options.slice(0, 3).map(opt => (
                <Stack key={opt.id} direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: 0.5,
                      border: 2,
                      borderColor: 'grey.400',
                    }}
                  />
                  <Typography variant="caption">{opt.label}</Typography>
                </Stack>
              ))}
            </Stack>
          );
        }
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: 0.5,
                border: 2,
                borderColor: 'grey.400',
              }}
            />
            <Typography variant="caption">Yes / No</Typography>
          </Stack>
        );
      case 'signature':
        return (
          <Box
            sx={{
              height: 60,
              border: 1,
              borderColor: 'grey.300',
              borderRadius: 1,
              bgcolor: 'grey.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Tap to sign
            </Typography>
          </Box>
        );
      case 'photo_upload':
      case 'video_upload':
      case 'file_upload':
        return (
          <Box
            sx={{
              height: 60,
              border: 1,
              borderColor: 'grey.300',
              borderRadius: 1,
              bgcolor: 'grey.50',
              borderStyle: 'dashed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            {field.type === 'photo_upload' && <Camera size={16} className="text-muted-foreground" />}
            {field.type === 'video_upload' && <Video size={16} className="text-muted-foreground" />}
            {field.type === 'file_upload' && <Paperclip size={16} className="text-muted-foreground" />}
            <Typography variant="caption" color="text.secondary">
              {field.type === 'photo_upload' ? 'Take or upload photo' :
               field.type === 'video_upload' ? 'Record or upload video' :
               'Upload file'}
            </Typography>
          </Box>
        );
      case 'barcode_scan':
      case 'qr_scan':
        return (
          <Button variant="outline" size="sm" disabled className="w-full">
            {field.type === 'barcode_scan' ? <ScanBarcode size={14} className="mr-1" /> : <QrCode size={14} className="mr-1" />}
            Scan {field.type === 'barcode_scan' ? 'Barcode' : 'QR Code'}
          </Button>
        );
      case 'location':
        return (
          <Button variant="outline" size="sm" disabled className="w-full">
            <MapPin size={14} className="mr-1" />
            Capture Location
          </Button>
        );
      case 'staff_selector':
        return (
          <Select disabled>
            <SelectTrigger className="h-8 text-sm bg-muted/50">
              <SelectValue placeholder="Select staff member..." />
            </SelectTrigger>
          </Select>
        );
      case 'section_header':
        return null;
      case 'instructions':
        return (
          <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="info.dark">
              {field.description || 'Instruction text will appear here'}
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const renderSection = (section: FormSection) => {
    const sectionFields = fieldsBySection[section.id] || [];
    const isExpanded = expandedSections.has(section.id);
    const isDragOver = dragOverSectionId === section.id;
    const isSectionDragging = draggedSectionId === section.id;
    const isSectionDragTarget = dragOverSectionTarget === section.id;

    return (
      <Box 
        key={section.id} 
        sx={{ 
          mb: 2,
          opacity: isSectionDragging ? 0.5 : 1,
          transition: 'opacity 0.15s ease',
        }}
        draggable
        onDragStart={(e) => handleSectionDragStart(e, section.id)}
        onDragEnd={handleSectionDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
          if (draggedSectionId && draggedSectionId !== section.id) {
            setDragOverSectionTarget(section.id);
          }
        }}
        onDragLeave={() => setDragOverSectionTarget(null)}
        onDrop={(e) => handleSectionDropOnSection(e, section.id)}
      >
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(section.id)}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: isSectionDragTarget ? 'primary.50' : 'grey.100',
              borderRadius: 1,
              mb: 1,
              border: 2,
              borderColor: isSectionDragTarget ? 'primary.main' : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <CollapsibleTrigger asChild>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ cursor: 'pointer' }}
              >
                {/* Section drag handle */}
                <Box
                  sx={{
                    cursor: 'grab',
                    color: 'text.disabled',
                    '&:hover': { color: 'text.secondary' },
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical size={14} />
                </Box>
                <Box sx={{ color: 'text.secondary' }}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {section.title}
                  </Typography>
                  {section.description && (
                    <Typography variant="caption" color="text.secondary">
                      {section.description}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={`${sectionFields.length} field${sectionFields.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 20 }}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical size={14} />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings size={14} className="mr-2" />
                      Edit Section
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy size={14} className="mr-2" />
                      Duplicate Section
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 size={14} className="mr-2" />
                      Delete Section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Stack>
            </CollapsibleTrigger>
          </Paper>

          <CollapsibleContent>
            <Box 
              sx={{ pl: 2 }}
              onDragOver={(e) => handleFieldDropZoneDragOver(e, section.id)}
              onDragLeave={handleFieldDropZoneDragLeave}
              onDrop={(e) => handleSectionDrop(e, section.id)}
            >
              {sectionFields.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    border: 2,
                    borderColor: isDragOver ? 'primary.main' : 'grey.200',
                    borderStyle: 'dashed',
                    borderRadius: 1,
                    textAlign: 'center',
                    bgcolor: isDragOver ? 'primary.50' : 'grey.50',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Typography variant="body2" color={isDragOver ? 'primary.main' : 'text.secondary'}>
                    {isDragOver ? 'Drop field here' : 'Drag fields here or click from palette to add'}
                  </Typography>
                </Box>
              ) : (
                <>
                  {sectionFields.map(field => renderFieldPreview(field))}
                  {/* Drop zone at the end of the section */}
                  <Box
                    sx={{
                      p: 2,
                      border: 2,
                      borderColor: isDragOver ? 'primary.main' : 'transparent',
                      borderStyle: 'dashed',
                      borderRadius: 1,
                      textAlign: 'center',
                      bgcolor: isDragOver ? 'primary.50' : 'transparent',
                      transition: 'all 0.15s ease',
                      minHeight: isDragOver ? 48 : 8,
                    }}
                  >
                    {isDragOver && (
                      <Typography variant="caption" color="primary.main">
                        Drop here to add at end
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </CollapsibleContent>
        </Collapsible>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Canvas header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {template.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={template.status}
                size="small"
                color={template.status === 'published' ? 'success' : template.status === 'draft' ? 'warning' : 'default'}
                sx={{ textTransform: 'capitalize', fontSize: '0.65rem', height: 20 }}
              />
              <Typography variant="caption" color="text.secondary">
                v{template.version} • {template.sections.length} sections • {template.fields.length} fields
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outline" size="sm">
              <Eye size={14} className="mr-1" />
              Preview
            </Button>
            <Button size="sm">
              <Save size={14} className="mr-1" />
              Save
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Canvas content */}
      <ScrollArea className="flex-1">
        <Box sx={{ p: 3 }}>
          {/* Sections */}
          {template.sections
            .sort((a, b) => a.order - b.order)
            .map(section => renderSection(section))}

          {/* Unsectioned fields */}
          {fieldsBySection['_unsectioned']?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Unsectioned Fields
              </Typography>
              {fieldsBySection['_unsectioned'].map(field => renderFieldPreview(field))}
            </Box>
          )}

          {/* Add section button */}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              const newSection: FormSection = {
                id: `section-${Date.now()}`,
                title: 'New Section',
                order: template.sections.length,
              };
              onTemplateChange({
                ...template,
                sections: [...template.sections, newSection],
              });
              setExpandedSections(prev => new Set([...prev, newSection.id]));
              toast.success('Section added');
            }}
          >
            <Plus size={14} className="mr-1" />
            Add Section
          </Button>
        </Box>
      </ScrollArea>
    </Box>
  );
}
