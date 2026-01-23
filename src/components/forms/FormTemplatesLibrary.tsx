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
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormTemplate, FORM_CATEGORIES } from '@/types/forms';
import { mockFormTemplates } from '@/data/mockFormData';

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

interface FormTemplatesLibraryProps {
  onSelectTemplate: (template: FormTemplate) => void;
  onPreviewTemplate: (template: FormTemplate) => void;
  onCreateNew: () => void;
}

export function FormTemplatesLibrary({ onSelectTemplate, onPreviewTemplate, onCreateNew }: FormTemplatesLibraryProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>(mockFormTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      const matchesStatus = !statusFilter || template.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [templates, searchQuery, selectedCategory, statusFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, templateId: string) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedTemplateId(templateId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTemplateId(null);
  };

  const handleDuplicate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      const duplicated: FormTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Copy)`,
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: undefined,
      };
      setTemplates(prev => [duplicated, ...prev]);
    }
    handleMenuClose();
  };

  const handleArchive = () => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === selectedTemplateId ? { ...t, status: 'archived' as const } : t
      )
    );
    handleMenuClose();
  };

  const handleDelete = () => {
    setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
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

        {/* Category Filters */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All"
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

        {/* Status Filters */}
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
        </Stack>
      </Box>

      {/* Templates Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {categoryIcons[template.category]}
                    <Badge variant={getStatusColor(template.status)}>
                      {template.status}
                    </Badge>
                  </div>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, template.id)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </IconButton>
                </div>
                <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon><Copy className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ListItemIcon><Archive className="h-4 w-4" /></ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><Trash2 className="h-4 w-4 text-destructive" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
