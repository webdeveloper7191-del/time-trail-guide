import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search,
  Shield,
  Sparkles,
  Wrench,
  AlertTriangle,
  ArrowLeftRight,
  ClipboardCheck,
  GraduationCap,
  FileText,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Eye,
  Archive,
  Power,
  PowerOff,
  Building2,
  Palette,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormTemplate, FORM_CATEGORIES } from '@/types/forms';
import { DuplicateTemplateModal } from './DuplicateTemplateModal';
import { mockFormTemplates } from '@/data/mockFormData';
import { toast } from 'sonner';

const categoryIcons: Record<string, React.ReactNode> = {
  safety: <Shield className="h-4 w-4" />,
  cleaning: <Sparkles className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  incident: <AlertTriangle className="h-4 w-4" />,
  handover: <ArrowLeftRight className="h-4 w-4" />,
  inspection: <ClipboardCheck className="h-4 w-4" />,
  training: <GraduationCap className="h-4 w-4" />,
  custom: <FileText className="h-4 w-4" />,
};

// Industry groups for filtering
const INDUSTRY_GROUPS = [
  { id: 'all', label: 'All Industries' },
  { id: 'childcare', label: 'Childcare', pattern: 'childcare' },
  { id: 'agedcare', label: 'Aged Care', pattern: 'agedcare' },
  { id: 'hospital', label: 'Hospital', pattern: 'hospital' },
  { id: 'retail', label: 'Retail', pattern: 'retail' },
  { id: 'cleaning', label: 'Cleaning', pattern: 'cleaning' },
  { id: 'hospitality', label: 'Hospitality', pattern: 'hospitality' },
  { id: 'construction', label: 'Construction', pattern: 'construction' },
  { id: 'security', label: 'Security', pattern: 'security' },
  { id: 'general', label: 'General', pattern: 'template-[0-9]' },
];

interface FormTemplatesLibraryProps {
  onSelectTemplate: (template: FormTemplate) => void;
  onPreviewTemplate: (template: FormTemplate) => void;
  onCreateNew: () => void;
}

export function FormTemplatesLibrary({ onSelectTemplate, onPreviewTemplate, onCreateNew }: FormTemplatesLibraryProps) {
  // Initialize templates with isEnabled default
  const [templates, setTemplates] = useState<FormTemplate[]>(
    mockFormTemplates.map(t => ({
      ...t,
      isEnabled: t.isEnabled ?? true,
      isIndustryTemplate: t.id.includes('-childcare-') || t.id.includes('-agedcare-') || 
                          t.id.includes('-hospital-') || t.id.includes('-retail-') ||
                          t.id.includes('-cleaning-') || t.id.includes('-hospitality-') ||
                          t.id.includes('-construction-') || t.id.includes('-security-') ||
                          t.id.includes('-maintenance-'),
    }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [enabledFilter, setEnabledFilter] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<FormTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      const matchesStatus = !statusFilter || template.status === statusFilter;
      
      // Industry filter
      let matchesIndustry = true;
      if (selectedIndustry !== 'all') {
        const group = INDUSTRY_GROUPS.find(g => g.id === selectedIndustry);
        if (group?.pattern) {
          matchesIndustry = new RegExp(group.pattern).test(template.id);
        }
      }

      // Enabled filter
      let matchesEnabled = true;
      if (enabledFilter === 'enabled') {
        matchesEnabled = template.isEnabled !== false;
      } else if (enabledFilter === 'disabled') {
        matchesEnabled = template.isEnabled === false;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesIndustry && matchesEnabled;
    });
  }, [templates, searchQuery, selectedCategory, statusFilter, selectedIndustry, enabledFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, templateId: string) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedTemplateId(templateId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTemplateId(null);
  };

  const handleToggleEnabled = (templateId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setTemplates(prev =>
      prev.map(t => {
        if (t.id === templateId) {
          const newEnabled = !t.isEnabled;
          toast.success(newEnabled ? 'Template enabled' : 'Template disabled');
          return { ...t, isEnabled: newEnabled };
        }
        return t;
      })
    );
    handleMenuClose();
  };

  const handleOpenDuplicateModal = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      setTemplateToDuplicate(template);
      setDuplicateModalOpen(true);
    }
    handleMenuClose();
  };

  const handleDuplicateComplete = (newTemplate: FormTemplate) => {
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const handleArchive = () => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === selectedTemplateId ? { ...t, status: 'archived' as const } : t
      )
    );
    toast.success('Template archived');
    handleMenuClose();
  };

  const handleDelete = () => {
    setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
    toast.success('Template deleted');
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    return FORM_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  };

  const selectedTemplate = selectedTemplateId ? templates.find(t => t.id === selectedTemplateId) : null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Form Templates</Typography>
          <Button onClick={onCreateNew}>
            <FileText className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </Stack>
        
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className="h-4 w-4 text-muted-foreground" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Industry Filter */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <Building2 size={14} className="mr-1" /> Industry:
          </Typography>
          {INDUSTRY_GROUPS.slice(0, 6).map(group => (
            <Chip
              key={group.id}
              label={group.label}
              size="small"
              variant={selectedIndustry === group.id ? 'filled' : 'outlined'}
              onClick={() => setSelectedIndustry(group.id)}
            />
          ))}
          <Chip
            label="More..."
            size="small"
            variant="outlined"
            onClick={() => setSelectedIndustry(selectedIndustry === 'all' ? 'general' : 'all')}
          />
        </Stack>

        {/* Category Filters */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All Categories"
            size="small"
            variant={selectedCategory === null ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory(null)}
          />
          {FORM_CATEGORIES.map(category => (
            <Chip
              key={category.id}
              icon={categoryIcons[category.id] as React.ReactElement}
              label={category.label}
              size="small"
              variant={selectedCategory === category.id ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </Stack>

        {/* Status & Enabled Filters */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip
            label="All Status"
            size="small"
            variant={statusFilter === null ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter(null)}
          />
          <Chip
            label="Published"
            size="small"
            variant={statusFilter === 'published' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('published')}
          />
          <Chip
            label="Draft"
            size="small"
            variant={statusFilter === 'draft' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('draft')}
          />
          <Chip
            label="Archived"
            size="small"
            variant={statusFilter === 'archived' ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter('archived')}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Chip
            icon={<Power size={14} />}
            label="Enabled"
            size="small"
            color={enabledFilter === 'enabled' ? 'success' : 'default'}
            variant={enabledFilter === 'enabled' ? 'filled' : 'outlined'}
            onClick={() => setEnabledFilter(enabledFilter === 'enabled' ? null : 'enabled')}
          />
          <Chip
            icon={<PowerOff size={14} />}
            label="Disabled"
            size="small"
            color={enabledFilter === 'disabled' ? 'error' : 'default'}
            variant={enabledFilter === 'disabled' ? 'filled' : 'outlined'}
            onClick={() => setEnabledFilter(enabledFilter === 'disabled' ? null : 'disabled')}
          />
        </Stack>
      </Box>

      {/* Templates Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card 
              key={template.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${template.isEnabled === false ? 'opacity-60' : ''}`}
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {categoryIcons[template.category]}
                    <Badge variant={getStatusColor(template.status)}>
                      {template.status}
                    </Badge>
                    {template.isEnabled === false && (
                      <Badge variant="outline" className="text-muted-foreground">
                        <PowerOff className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                    {template.isIndustryTemplate && (
                      <Tooltip title="Industry Template - Duplicate to customize">
                        <Badge variant="secondary">
                          <Building2 className="h-3 w-3 mr-1" />
                          Industry
                        </Badge>
                      </Tooltip>
                    )}
                  </div>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Tooltip title={template.isEnabled !== false ? 'Disable template' : 'Enable template'}>
                      <Switch
                        size="small"
                        checked={template.isEnabled !== false}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleEnabled(template.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, template.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </IconButton>
                  </Stack>
                </div>
                <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    {getCategoryLabel(template.category)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    v{template.version}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {template.fields.length} fields
                  </Typography>
                  {template.branding?.logo && (
                    <>
                      <Typography variant="caption" color="text.secondary">•</Typography>
                      <Palette size={12} className="text-primary" />
                    </>
                  )}
                </Stack>
                
                <Stack direction="row" spacing={1}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewTemplate(template);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <Typography variant="h6" color="text.secondary">
              No templates found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const template = templates.find(t => t.id === selectedTemplateId);
          if (template) onPreviewTemplate(template);
          handleMenuClose();
        }}>
          <ListItemIcon><Eye className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const template = templates.find(t => t.id === selectedTemplateId);
          if (template) onSelectTemplate(template);
          handleMenuClose();
        }}>
          <ListItemIcon><Edit className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenDuplicateModal}>
          <ListItemIcon><Copy className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Duplicate & Customize</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleToggleEnabled(selectedTemplateId!)}>
          <ListItemIcon>
            {selectedTemplate?.isEnabled !== false ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedTemplate?.isEnabled !== false ? 'Disable' : 'Enable'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleArchive}>
          <ListItemIcon><Archive className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><Trash2 className="h-4 w-4 text-destructive" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Duplicate Modal */}
      <DuplicateTemplateModal
        open={duplicateModalOpen}
        template={templateToDuplicate}
        onClose={() => {
          setDuplicateModalOpen(false);
          setTemplateToDuplicate(null);
        }}
        onDuplicate={handleDuplicateComplete}
      />
    </Box>
  );
}
