import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Camera,
  Video,
  Paperclip,
  MapPin,
  Users,
  ScanBarcode,
  QrCode,
  Calendar,
  Clock,
  PenTool,
  X,
  Smartphone,
  Monitor,
  Tablet,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormTemplate, FormField, FormSection } from '@/types/forms';

type ViewMode = 'mobile' | 'tablet' | 'desktop';

interface FormPreviewProps {
  template: FormTemplate;
  onClose: () => void;
}

export function FormPreview({ template, onClose }: FormPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const containerWidth = useMemo(() => {
    switch (viewMode) {
      case 'mobile': return 375;
      case 'tablet': return 768;
      case 'desktop': return 1024;
    }
  }, [viewMode]);

  const fieldsBySection = useMemo(() => {
    const grouped: Record<string, FormField[]> = {};
    template.sections.forEach(section => {
      grouped[section.id] = template.fields
        .filter(f => f.sectionId === section.id)
        .sort((a, b) => a.order - b.order);
    });
    return grouped;
  }, [template]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when field changes
    if (errors[fieldId]) {
      setErrors(prev => {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateField = (field: FormField): string | null => {
    const value = formData[field.id];
    
    if (field.required) {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return 'This field is required';
      }
    }

    if (field.validation) {
      for (const rule of field.validation) {
        switch (rule.type) {
          case 'min_length':
            if (typeof value === 'string' && value.length < (rule.value as number)) {
              return rule.message;
            }
            break;
          case 'max_length':
            if (typeof value === 'string' && value.length > (rule.value as number)) {
              return rule.message;
            }
            break;
          case 'min_value':
            if (typeof value === 'number' && value < (rule.value as number)) {
              return rule.message;
            }
            break;
          case 'max_value':
            if (typeof value === 'number' && value > (rule.value as number)) {
              return rule.message;
            }
            break;
        }
      }
    }

    // Number range validation
    if (field.type === 'number' && field.settings) {
      const numValue = Number(value);
      if (field.settings.min !== undefined && numValue < field.settings.min) {
        return `Value must be at least ${field.settings.min}`;
      }
      if (field.settings.max !== undefined && numValue > field.settings.max) {
        return `Value must be at most ${field.settings.max}`;
      }
    }

    return null;
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    template.fields.forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true);
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const renderField = (field: FormField) => {
    const error = errors[field.id];
    const value = formData[field.id];

    switch (field.type) {
      case 'short_text':
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            placeholder={field.placeholder}
            required={field.required}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            error={!!error}
            helperText={error || field.description}
          />
        );

      case 'long_text':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label={field.label}
            placeholder={field.placeholder}
            required={field.required}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            error={!!error}
            helperText={error || field.description}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            size="small"
            label={field.label}
            required={field.required}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value ? Number(e.target.value) : '')}
            error={!!error}
            helperText={error || field.description}
            inputProps={{
              min: field.settings?.min,
              max: field.settings?.max,
              step: field.settings?.step || 1,
            }}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            size="small"
            label={field.label}
            required={field.required}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            error={!!error}
            helperText={error || field.description}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />,
            }}
          />
        );

      case 'time':
        return (
          <TextField
            fullWidth
            type="time"
            size="small"
            label={field.label}
            required={field.required}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            error={!!error}
            helperText={error || field.description}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <Clock className="h-4 w-4 mr-2 text-muted-foreground" />,
            }}
          />
        );

      case 'datetime':
        return (
          <TextField
            fullWidth
            type="datetime-local"
            size="small"
            label={field.label}
            required={field.required}
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            error={!!error}
            helperText={error || field.description}
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'dropdown':
        return (
          <FormControl fullWidth size="small" error={!!error}>
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              value={value || ''}
              label={field.label}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {field.options?.map(opt => (
                <MenuItem key={opt.id} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            <FormHelperText>{error || field.description}</FormHelperText>
          </FormControl>
        );

      case 'multi_select':
        return (
          <FormControl fullWidth size="small" error={!!error}>
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              multiple
              value={value || []}
              label={field.label}
              onChange={(e) => handleChange(field.id, e.target.value)}
              renderValue={(selected) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {(selected as string[]).map((val) => (
                    <Chip
                      key={val}
                      label={field.options?.find(o => o.value === val)?.label || val}
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            >
              {field.options?.map(opt => (
                <MenuItem key={opt.id} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            <FormHelperText>{error || field.description}</FormHelperText>
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl error={!!error}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {field.options?.map(opt => (
                <FormControlLabel
                  key={opt.id}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
            {(error || field.description) && (
              <FormHelperText>{error || field.description}</FormHelperText>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControl error={!!error}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  size="small"
                />
              }
              label={
                <span>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </span>
              }
            />
            {(error || field.description) && (
              <FormHelperText>{error || field.description}</FormHelperText>
            )}
          </FormControl>
        );

      case 'signature':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: error ? 'error.main' : 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                bgcolor: 'grey.50',
                cursor: 'pointer',
              }}
              onClick={() => handleChange(field.id, 'signed')}
            >
              {value ? (
                <Stack alignItems="center" spacing={1}>
                  <Check className="h-6 w-6 text-primary" />
                  <Typography variant="body2" color="primary">Signed</Typography>
                </Stack>
              ) : (
                <Stack alignItems="center" spacing={1}>
                  <PenTool className="h-6 w-6 text-muted-foreground" />
                  <Typography variant="body2" color="text.secondary">Tap to sign</Typography>
                </Stack>
              )}
            </Box>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'photo_upload':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Button variant="outline" className="w-full justify-start">
              <Camera className="h-4 w-4 mr-2" />
              Take or Upload Photo
            </Button>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'video_upload':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Button variant="outline" className="w-full justify-start">
              <Video className="h-4 w-4 mr-2" />
              Record or Upload Video
            </Button>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'file_upload':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Button variant="outline" className="w-full justify-start">
              <Paperclip className="h-4 w-4 mr-2" />
              Attach File
            </Button>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'barcode_scan':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Button variant="outline" className="w-full justify-start">
              <ScanBarcode className="h-4 w-4 mr-2" />
              Scan Barcode
            </Button>
            {value && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Scanned: {value}
              </Typography>
            )}
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'qr_scan':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Button variant="outline" className="w-full justify-start">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'location':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleChange(field.id, { lat: -33.8688, lng: 151.2093 })}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {value ? 'Location Captured' : 'Capture Location'}
            </Button>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'staff_selector':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Typography>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Select Staff Member{field.settings?.allowMultiple ? 's' : ''}
            </Button>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        );

      case 'section_header':
        return null; // Handled by section rendering

      case 'instructions':
        return (
          <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, border: 1, borderColor: 'info.light' }}>
            <Typography variant="body2">{field.label}</Typography>
            {field.description && (
              <Typography variant="caption" color="text.secondary">
                {field.description}
              </Typography>
            )}
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Unsupported field type: {field.type}
          </Typography>
        );
    }
  };

  if (submitted) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Form Preview</Typography>
          <IconButton onClick={onClose}><X className="h-5 w-5" /></IconButton>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack alignItems="center" spacing={2}>
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <Typography variant="h5">Form Submitted!</Typography>
            <Typography variant="body2" color="text.secondary">
              This is a preview. In production, the form would be saved.
            </Typography>
            <Button onClick={() => setSubmitted(false)}>Reset Preview</Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">Form Preview</Typography>
            <Badge variant="outline">{template.name}</Badge>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* View Mode Switcher */}
            <Stack direction="row" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setViewMode('mobile')}
                sx={{ bgcolor: viewMode === 'mobile' ? 'action.selected' : 'transparent' }}
              >
                <Smartphone className="h-4 w-4" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('tablet')}
                sx={{ bgcolor: viewMode === 'tablet' ? 'action.selected' : 'transparent' }}
              >
                <Tablet className="h-4 w-4" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('desktop')}
                sx={{ bgcolor: viewMode === 'desktop' ? 'action.selected' : 'transparent' }}
              >
                <Monitor className="h-4 w-4" />
              </IconButton>
            </Stack>
            <IconButton onClick={onClose}><X className="h-5 w-5" /></IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Preview Container */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', p: 3 }}>
        <Box
          sx={{
            width: containerWidth,
            maxWidth: '100%',
            bgcolor: 'background.paper',
            borderRadius: viewMode === 'mobile' ? 4 : 2,
            boxShadow: 3,
            overflow: 'hidden',
            border: viewMode === 'mobile' ? '8px solid' : 'none',
            borderColor: 'grey.800',
          }}
        >
          {/* Form Header */}
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h6">{template.name}</Typography>
            {template.description && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {template.description}
              </Typography>
            )}
          </Box>

          {/* Form Content */}
          <Box sx={{ p: 2 }}>
            {template.sections.sort((a, b) => a.order - b.order).map((section) => (
              <Card key={section.id} className="mb-4">
                <CardHeader 
                  className="cursor-pointer py-3"
                  onClick={() => section.collapsible && toggleSection(section.id)}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    {section.collapsible && (
                      collapsedSections.has(section.id) 
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronUp className="h-4 w-4" />
                    )}
                  </Stack>
                  {section.description && !collapsedSections.has(section.id) && (
                    <Typography variant="caption" color="text.secondary">
                      {section.description}
                    </Typography>
                  )}
                </CardHeader>
                {!collapsedSections.has(section.id) && (
                  <CardContent className="pt-0">
                    <Stack spacing={2}>
                      {fieldsBySection[section.id]?.map((field) => (
                        <Box key={field.id}>{renderField(field)}</Box>
                      ))}
                    </Stack>
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Submit Button */}
            <Button className="w-full mt-4" size="lg" onClick={handleSubmit}>
              Submit Form
            </Button>

            {Object.keys(errors).length > 0 && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2, color: 'error.main' }}>
                <AlertCircle className="h-4 w-4" />
                <Typography variant="body2">
                  Please fix {Object.keys(errors).length} error(s) before submitting
                </Typography>
              </Stack>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
