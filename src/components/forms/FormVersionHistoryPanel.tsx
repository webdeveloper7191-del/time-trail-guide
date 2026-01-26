import { useState } from 'react';
import { Box, Typography, Stack, IconButton, Paper, Divider } from '@mui/material';
import { History, RotateCcw, Eye, ChevronRight, Clock, User, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FormTemplate } from '@/types/forms';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface VersionHistoryEntry {
  id: string;
  version: number;
  template: FormTemplate;
  savedAt: string;
  savedBy?: string;
  changeDescription?: string;
}

interface FormVersionHistoryPanelProps {
  currentTemplate: FormTemplate;
  onRestore: (template: FormTemplate) => void;
  onClose: () => void;
  onPreview?: (template: FormTemplate) => void;
}

export function FormVersionHistoryPanel({
  currentTemplate,
  onRestore,
  onClose,
  onPreview,
}: FormVersionHistoryPanelProps) {
  // Generate mock version history based on current template
  const [versionHistory] = useState<VersionHistoryEntry[]>(() => {
    const history: VersionHistoryEntry[] = [];
    
    // Current version
    history.push({
      id: `v-${currentTemplate.version}`,
      version: currentTemplate.version,
      template: currentTemplate,
      savedAt: currentTemplate.updatedAt,
      savedBy: 'Current User',
      changeDescription: 'Current version',
    });

    // Generate previous versions if current version > 1
    for (let v = currentTemplate.version - 1; v >= 1; v--) {
      const date = new Date(currentTemplate.createdAt);
      date.setDate(date.getDate() - (currentTemplate.version - v) * 7);
      
      history.push({
        id: `v-${v}`,
        version: v,
        template: {
          ...currentTemplate,
          version: v,
          fields: currentTemplate.fields.slice(0, Math.max(1, currentTemplate.fields.length - (currentTemplate.version - v))),
          updatedAt: date.toISOString(),
          status: v === 1 ? 'draft' : 'published',
        },
        savedAt: date.toISOString(),
        savedBy: v === 1 ? 'Admin User' : 'Current User',
        changeDescription: v === 1 
          ? 'Initial version created' 
          : `Updated ${currentTemplate.version - v} field(s)`,
      });
    }

    return history;
  });

  const handleRestore = (entry: VersionHistoryEntry) => {
    if (entry.version === currentTemplate.version) {
      toast.info('This is already the current version');
      return;
    }
    
    const restoredTemplate: FormTemplate = {
      ...entry.template,
      version: currentTemplate.version + 1,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    
    onRestore(restoredTemplate);
    toast.success(`Restored to version ${entry.version} as new draft (v${restoredTemplate.version})`);
    onClose();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <History size={18} />
            <Typography variant="subtitle1" fontWeight={600}>
              Version History
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {versionHistory.length} version{versionHistory.length !== 1 ? 's' : ''} saved
        </Typography>
      </Box>

      {/* Version list */}
      <ScrollArea className="flex-1">
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            {versionHistory.map((entry, index) => {
              const isCurrent = entry.version === currentTemplate.version;
              
              return (
                <Paper
                  key={entry.id}
                  sx={{
                    p: 2,
                    border: 2,
                    borderColor: isCurrent ? 'primary.main' : 'transparent',
                    bgcolor: isCurrent ? 'primary.50' : 'background.paper',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isCurrent ? 'primary.main' : 'grey.300',
                    },
                  }}
                >
                  <Stack spacing={1.5}>
                    {/* Version header */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Version {entry.version}
                        </Typography>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                        {entry.template.status === 'published' && !isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            Published
                          </Badge>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(entry.savedAt), 'MMM d, yyyy')}
                      </Typography>
                    </Stack>

                    {/* Version details */}
                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Clock size={12} className="text-muted-foreground" />
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(entry.savedAt), 'h:mm a')}
                        </Typography>
                      </Stack>
                      {entry.savedBy && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <User size={12} className="text-muted-foreground" />
                          <Typography variant="caption" color="text.secondary">
                            {entry.savedBy}
                          </Typography>
                        </Stack>
                      )}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FileText size={12} className="text-muted-foreground" />
                        <Typography variant="caption" color="text.secondary">
                          {entry.template.fields.length} fields, {entry.template.sections.length} sections
                        </Typography>
                      </Stack>
                    </Stack>

                    {entry.changeDescription && (
                      <Typography variant="caption" sx={{ fontStyle: 'italic' }} color="text.secondary">
                        "{entry.changeDescription}"
                      </Typography>
                    )}

                    {/* Actions */}
                    {!isCurrent && (
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        {onPreview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPreview(entry.template)}
                          >
                            <Eye size={14} className="mr-1" />
                            Preview
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(entry)}
                        >
                          <RotateCcw size={14} className="mr-1" />
                          Restore
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      </ScrollArea>

      {/* Footer info */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          💡 Restoring a version creates a new draft based on that version's content
        </Typography>
      </Box>
    </Box>
  );
}
