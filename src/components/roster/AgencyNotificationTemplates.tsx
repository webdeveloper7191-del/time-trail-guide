import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  TextField,
  Chip,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Collapse,
} from '@mui/material';
import {
  Mail,
  MessageSquare,
  Bell,
  Webhook,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import {
  NotificationTemplate,
  NotificationEventType,
  NotificationChannel,
  defaultNotificationTemplates,
  eventTypeVariables,
  TemplateVariable,
} from '@/lib/agencyNotificationService';
import { toast } from 'sonner';

interface AgencyNotificationTemplatesProps {
  open: boolean;
  onClose: () => void;
}

const eventTypeLabels: Record<NotificationEventType, string> = {
  shift_broadcast: 'Shift Broadcast',
  shift_urgent: 'Urgent Shift Alert',
  shift_escalated: 'Shift Escalated',
  shift_filled: 'Shift Filled',
  shift_cancelled: 'Shift Cancelled',
  candidate_accepted: 'Candidate Accepted',
  candidate_rejected: 'Candidate Rejected',
  timesheet_reminder: 'Timesheet Reminder',
  compliance_alert: 'Compliance Alert',
};

const eventTypeIcons: Record<NotificationEventType, React.ReactNode> = {
  shift_broadcast: <Send size={16} />,
  shift_urgent: <AlertTriangle size={16} />,
  shift_escalated: <AlertTriangle size={16} />,
  shift_filled: <CheckCircle2 size={16} />,
  shift_cancelled: <XCircle size={16} />,
  candidate_accepted: <CheckCircle2 size={16} />,
  candidate_rejected: <XCircle size={16} />,
  timesheet_reminder: <Clock size={16} />,
  compliance_alert: <AlertTriangle size={16} />,
};

const channelIcons: Record<NotificationChannel, React.ReactNode> = {
  email: <Mail size={16} />,
  sms: <MessageSquare size={16} />,
  app_push: <Bell size={16} />,
  webhook: <Webhook size={16} />,
};

const channelLabels: Record<NotificationChannel, string> = {
  email: 'Email',
  sms: 'SMS',
  app_push: 'Push Notification',
  webhook: 'Webhook',
};

export function AgencyNotificationTemplates({ open, onClose }: AgencyNotificationTemplatesProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultNotificationTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<NotificationTemplate | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<NotificationEventType>>(new Set(['shift_broadcast']));
  const [showPreview, setShowPreview] = useState(false);

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.eventType]) {
      acc[template.eventType] = [];
    }
    acc[template.eventType].push(template);
    return acc;
  }, {} as Record<NotificationEventType, NotificationTemplate[]>);

  const toggleEvent = (eventType: NotificationEventType) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventType)) {
        next.delete(eventType);
      } else {
        next.add(eventType);
      }
      return next;
    });
  };

  const handleEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate({ ...template });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editedTemplate) return;
    
    setTemplates(prev => 
      prev.map(t => t.id === editedTemplate.id ? editedTemplate : t)
    );
    setSelectedTemplate(editedTemplate);
    setIsEditing(false);
    toast.success('Template saved successfully');
  };

  const handleCancel = () => {
    setEditedTemplate(selectedTemplate ? { ...selectedTemplate } : null);
    setIsEditing(false);
  };

  const handleToggleActive = (templateId: string) => {
    setTemplates(prev =>
      prev.map(t => t.id === templateId ? { ...t, isActive: !t.isActive } : t)
    );
    toast.success('Template status updated');
  };

  const insertVariable = (variable: TemplateVariable) => {
    if (!editedTemplate) return;
    
    // Insert at cursor position or append
    setEditedTemplate({
      ...editedTemplate,
      body: editedTemplate.body + ' ' + variable.key,
    });
    toast.info(`Inserted ${variable.key}`);
  };

  const copyVariable = (variable: TemplateVariable) => {
    navigator.clipboard.writeText(variable.key);
    toast.success(`Copied ${variable.key}`);
  };

  const renderTemplateCard = (template: NotificationTemplate) => (
    <Paper
      key={template.id}
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: template.isActive ? 1 : 0.6,
        '&:hover': {
          borderColor: 'primary.light',
          bgcolor: 'action.hover',
        },
      }}
      onClick={() => {
        setSelectedTemplate(template);
        setEditedTemplate({ ...template });
        setIsEditing(false);
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ color: 'primary.main' }}>
            {channelIcons[template.channel]}
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {template.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {channelLabels[template.channel]}
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label={template.isActive ? 'Active' : 'Inactive'}
            color={template.isActive ? 'success' : 'default'}
            variant="outlined"
            sx={{ fontSize: '0.65rem' }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(template);
            }}
          >
            <Edit2 size={14} />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );

  const renderVariableChip = (variable: TemplateVariable, insertable: boolean) => (
    <Chip
      key={variable.key}
      size="small"
      label={variable.key.replace(/[{}]/g, '')}
      variant="outlined"
      onClick={() => insertable ? insertVariable(variable) : copyVariable(variable)}
      onDelete={() => copyVariable(variable)}
      deleteIcon={<Copy size={12} />}
      sx={{
        fontSize: '0.7rem',
        cursor: 'pointer',
        '& .MuiChip-deleteIcon': {
          opacity: 0.6,
          '&:hover': { opacity: 1 },
        },
      }}
    />
  );

  const renderPreview = () => {
    if (!selectedTemplate) return null;
    
    const template = isEditing && editedTemplate ? editedTemplate : selectedTemplate;
    const variables = eventTypeVariables[template.eventType];
    
    // Replace variables with examples
    let previewSubject = template.subject;
    let previewBody = template.body;
    
    variables.forEach(v => {
      const regex = new RegExp(v.key.replace(/[{}]/g, '\\$&'), 'g');
      previewSubject = previewSubject.replace(regex, v.example);
      previewBody = previewBody.replace(regex, v.example);
    });

    return (
      <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Preview
        </Typography>
        {template.channel === 'email' && (
          <>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Subject: {previewSubject}
            </Typography>
            <Divider sx={{ my: 1 }} />
          </>
        )}
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem' }}
        >
          {previewBody}
        </Typography>
      </Paper>
    );
  };

  const renderEditor = () => {
    if (!selectedTemplate) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography color="text.secondary">
            Select a template to view or edit
          </Typography>
        </Box>
      );
    }

    const template = isEditing && editedTemplate ? editedTemplate : selectedTemplate;
    const variables = eventTypeVariables[template.eventType];

    return (
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {template.name}
            </Typography>
            <Stack direction="row" spacing={1} mt={0.5}>
              <Chip
                size="small"
                icon={eventTypeIcons[template.eventType] as React.ReactElement}
                label={eventTypeLabels[template.eventType]}
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip
                size="small"
                icon={channelIcons[template.channel] as React.ReactElement}
                label={channelLabels[template.channel]}
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Stack>
          </Box>
          
          <Stack direction="row" spacing={1}>
            {isEditing ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<X size={14} />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Save size={14} />}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={template.isActive}
                      onChange={() => handleToggleActive(template.id)}
                    />
                  }
                  label="Active"
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Eye size={14} />}
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Edit2 size={14} />}
                  onClick={() => handleEdit(template)}
                >
                  Edit
                </Button>
              </>
            )}
          </Stack>
        </Stack>

        {/* Available Variables */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Available Variables
          </Typography>
          <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {variables.map(v => renderVariableChip(v, isEditing))}
            </Stack>
          </Paper>
        </Box>

        {/* Subject (email only) */}
        {template.channel === 'email' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Subject Line
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                size="small"
                value={editedTemplate?.subject || ''}
                onChange={(e) => setEditedTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                placeholder="Email subject line..."
              />
            ) : (
              <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body2">{template.subject}</Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Body */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Message Body
          </Typography>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={12}
              size="small"
              value={editedTemplate?.body || ''}
              onChange={(e) => setEditedTemplate(prev => prev ? { ...prev, body: e.target.value } : null)}
              placeholder="Message body..."
              sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          ) : (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}
              >
                {template.body}
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Preview */}
        <Collapse in={showPreview && !isEditing}>
          {renderPreview()}
        </Collapse>

        {/* Variable Reference */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Variable Reference
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={1}>
              {variables.map(v => (
                <Stack key={v.key} direction="row" spacing={2} alignItems="flex-start">
                  <Chip
                    size="small"
                    label={v.key}
                    sx={{ minWidth: 160, fontFamily: 'monospace', fontSize: '0.7rem' }}
                  />
                  <Box>
                    <Typography variant="body2">{v.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Example: {v.example}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Stack>
    );
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Notification Templates"
      description="Configure email, SMS, and push notification templates for agency communications"
      icon={Mail}
      size="3xl"
      showFooter={false}
    >
      <Stack direction="row" spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Left: Template List */}
        <Box sx={{ width: 320, flexShrink: 0, overflow: 'auto' }}>
          <Stack spacing={2}>
            {(Object.keys(eventTypeLabels) as NotificationEventType[]).map(eventType => {
              const eventTemplates = groupedTemplates[eventType] || [];
              if (eventTemplates.length === 0) return null;
              
              return (
                <Box key={eventType}>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => toggleEvent(eventType)}
                    endIcon={expandedEvents.has(eventType) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    sx={{
                      justifyContent: 'space-between',
                      textTransform: 'none',
                      color: 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {eventTypeIcons[eventType]}
                      <Typography variant="subtitle2">
                        {eventTypeLabels[eventType]}
                      </Typography>
                      <Chip
                        size="small"
                        label={eventTemplates.length}
                        sx={{ fontSize: '0.65rem', height: 18 }}
                      />
                    </Stack>
                  </Button>
                  
                  <Collapse in={expandedEvents.has(eventType)}>
                    <Stack spacing={1} sx={{ pl: 1 }}>
                      {eventTemplates.map(template => renderTemplateCard(template))}
                    </Stack>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
          
          <Divider sx={{ my: 2 }} />
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={() => toast.info('Create template coming soon')}
          >
            Create Template
          </Button>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Right: Editor */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {renderEditor()}
        </Box>
      </Stack>
    </PrimaryOffCanvas>
  );
}

export default AgencyNotificationTemplates;
