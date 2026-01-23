import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
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
  Search,
  GripVertical,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FieldType, FIELD_TYPES } from '@/types/forms';

// Icon mapping
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

interface FormFieldPaletteProps {
  onAddField: (fieldType: FieldType) => void;
}

export function FormFieldPalette({ onAddField }: FormFieldPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | false>('basic');

  const categories = ['basic', 'choice', 'media', 'advanced'] as const;
  const categoryLabels: Record<typeof categories[number], string> = {
    basic: 'Basic Fields',
    choice: 'Choice Fields',
    media: 'Media & Signature',
    advanced: 'Advanced Fields',
  };

  const filteredFields = FIELD_TYPES.filter(field =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fieldsByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredFields.filter(f => f.category === category);
    return acc;
  }, {} as Record<typeof categories[number], typeof FIELD_TYPES>);

  const handleDragStart = (e: React.DragEvent, fieldType: FieldType) => {
    e.dataTransfer.setData('fieldType', fieldType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          Field Types
        </Typography>
        <Box sx={{ position: 'relative' }}>
          <Search
            size={16}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </Box>
      </Box>

      {/* Field list */}
      <ScrollArea className="flex-1">
        <Box sx={{ p: 1 }}>
          {categories.map(category => {
            const fields = fieldsByCategory[category];
            if (fields.length === 0) return null;

            return (
              <Accordion
                key={category}
                expanded={expandedCategory === category || searchQuery.length > 0}
                onChange={(_, expanded) => setExpandedCategory(expanded ? category : false)}
                disableGutters
                elevation={0}
                sx={{
                  '&:before': { display: 'none' },
                  bgcolor: 'transparent',
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={14} />}
                  sx={{
                    minHeight: 36,
                    px: 1,
                    '& .MuiAccordionSummary-content': { my: 0.5 },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {categoryLabels[category]}
                    </Typography>
                    <Chip
                      label={fields.length}
                      size="small"
                      sx={{ fontSize: '0.6rem', height: 16, minWidth: 20 }}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0.5, pt: 0 }}>
                  <Stack spacing={0.5}>
                    {fields.map(field => {
                      const Icon = FIELD_ICONS[field.type];
                      return (
                        <Paper
                          key={field.type}
                          draggable
                          onDragStart={(e) => handleDragStart(e, field.type)}
                          onClick={() => onAddField(field.type)}
                          sx={{
                            p: 1.5,
                            cursor: 'grab',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: 'primary.50',
                              borderColor: 'primary.main',
                            },
                            '&:active': {
                              cursor: 'grabbing',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ color: 'text.disabled', cursor: 'grab' }}>
                              <GripVertical size={12} />
                            </Box>
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
                              <Typography variant="body2" fontWeight={500} noWrap>
                                {field.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {field.description}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </ScrollArea>

      {/* Hint */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          💡 Drag fields to the canvas or click to add to the selected section
        </Typography>
      </Box>
    </Box>
  );
}
