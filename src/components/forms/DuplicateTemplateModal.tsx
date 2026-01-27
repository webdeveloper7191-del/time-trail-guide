import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Drawer,
  IconButton,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import {
  X,
  Copy,
  Palette,
  Image,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormTemplate, FORM_CATEGORIES } from '@/types/forms';
import { toast } from 'sonner';

interface DuplicateTemplateModalProps {
  open: boolean;
  template: FormTemplate | null;
  onClose: () => void;
  onDuplicate: (newTemplate: FormTemplate) => void;
}

export function DuplicateTemplateModal({
  open,
  template,
  onClose,
  onDuplicate,
}: DuplicateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [applyBranding, setApplyBranding] = useState(true);
  const [customLogo, setCustomLogo] = useState('');
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [customBanner, setCustomBanner] = useState('');

  // Reset form when template changes
  const handleOpen = () => {
    if (template) {
      setName(`${template.name} (Copy)`);
      setDescription(template.description || '');
      setApplyBranding(true);
      setCustomLogo(template.branding?.logo || '');
      setCustomColor(template.branding?.primaryColor || '#3b82f6');
      setCustomBanner(template.branding?.headerImage || '');
    }
  };

  const handleDuplicate = () => {
    if (!template || !name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const newTemplate: FormTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      status: 'draft',
      isEnabled: true,
      isIndustryTemplate: false,
      version: 1,
      duplicatedFrom: template.id,
      branding: applyBranding ? {
        logo: customLogo || undefined,
        primaryColor: customColor || undefined,
        headerImage: customBanner || undefined,
      } : template.branding,
      // Deep clone sections and fields with new IDs
      sections: template.sections.map((section, idx) => ({
        ...section,
        id: `section-${Date.now()}-${idx}`,
      })),
      fields: template.fields.map((field, idx) => {
        const oldSectionId = field.sectionId;
        const sectionIndex = template.sections.findIndex(s => s.id === oldSectionId);
        return {
          ...field,
          id: `field-${Date.now()}-${idx}`,
          sectionId: sectionIndex >= 0 ? `section-${Date.now()}-${sectionIndex}` : undefined,
        };
      }),
      groups: template.groups?.map((group, idx) => {
        const oldSectionId = group.sectionId;
        const sectionIndex = template.sections.findIndex(s => s.id === oldSectionId);
        return {
          ...group,
          id: `group-${Date.now()}-${idx}`,
          sectionId: sectionIndex >= 0 ? `section-${Date.now()}-${sectionIndex}` : group.sectionId,
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined,
    };

    onDuplicate(newTemplate);
    toast.success(`Template "${name}" created successfully`);
    onClose();
  };

  const getCategoryLabel = (categoryId: string) => {
    return FORM_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      onTransitionEnter={handleOpen}
      PaperProps={{ sx: { width: 480 } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Copy size={20} className="text-primary" />
              <Typography variant="h6" fontWeight={600}>
                Duplicate Template
              </Typography>
            </Stack>
            <IconButton size="small" onClick={onClose}>
              <X size={20} />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {template && (
            <Stack spacing={3}>
              {/* Source Template Info */}
              <Alert severity="info" icon={<Building2 size={18} />}>
                <Typography variant="body2">
                  Duplicating from: <strong>{template.name}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getCategoryLabel(template.category)} • {template.fields.length} fields • v{template.version}
                </Typography>
              </Alert>

              <Divider />

              {/* New Template Details */}
              <Typography variant="subtitle2" fontWeight={600}>
                New Template Details
              </Typography>

              <TextField
                fullWidth
                label="Template Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter a name for your copy"
              />

              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Describe the purpose of this template"
              />

              <Divider />

              {/* Branding Options */}
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Palette size={18} className="text-primary" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Custom Branding
                  </Typography>
                </Stack>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applyBranding}
                      onChange={(e) => setApplyBranding(e.target.checked)}
                    />
                  }
                  label="Apply custom branding to this copy"
                />

                {applyBranding && (
                  <Stack spacing={2} sx={{ pl: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Logo URL"
                      value={customLogo}
                      onChange={(e) => setCustomLogo(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Image size={16} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Header Banner URL"
                      value={customBanner}
                      onChange={(e) => setCustomBanner(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Image size={16} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Primary Color
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          component="input"
                          type="color"
                          value={customColor}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomColor(e.target.value)}
                          sx={{
                            width: 40,
                            height: 40,
                            border: 'none',
                            borderRadius: 1,
                            cursor: 'pointer',
                            p: 0,
                          }}
                        />
                        <TextField
                          size="small"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          sx={{ width: 120 }}
                        />
                      </Stack>
                    </Box>

                    {/* Preview */}
                    {(customLogo || customBanner) && (
                      <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Branding Preview
                        </Typography>
                        {customBanner && (
                          <Box
                            sx={{
                              height: 60,
                              backgroundImage: `url(${customBanner})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: 1,
                              mb: 1,
                            }}
                          />
                        )}
                        <Box sx={{ p: 1, bgcolor: customColor, borderRadius: 1, color: 'white' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {customLogo && (
                              <Box
                                component="img"
                                src={customLogo}
                                alt="Logo"
                                sx={{ width: 24, height: 24, borderRadius: 0.5, bgcolor: 'white', p: 0.25 }}
                                onError={(e: any) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <Typography variant="body2" fontWeight={500}>
                              {name || 'Template Name'}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                )}
              </Stack>
            </Stack>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={!name.trim()}>
              <Check className="h-4 w-4 mr-1" />
              Create Copy
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
